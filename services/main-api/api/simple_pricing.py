from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import json
import os
from datetime import datetime
from pydantic import BaseModel

from database import get_db
from models.user import User
from api.auth import get_current_admin_user

router = APIRouter()

# 가격 설정 파일 경로 (로컬 개발용)
PRICING_CONFIG_PATH = "config/pricing.json"

# 환경변수로 기본 가격 설정 가능
DEFAULT_QNAME_PRICE = int(os.getenv("DEFAULT_QNAME_PRICE", "50"))
DEFAULT_QTEXT_PRICE = int(os.getenv("DEFAULT_QTEXT_PRICE", "30"))
DEFAULT_QCAPTURE_PRICE = int(os.getenv("DEFAULT_QCAPTURE_PRICE", "100"))

class ServicePriceUpdate(BaseModel):
    unit_price: int
    description: Optional[str] = None
    is_active: Optional[bool] = None

class PricingResponse(BaseModel):
    services: Dict[str, Any]
    last_updated: str
    updated_by: str
    source: str  # "database", "file", "env"

def get_default_config():
    """기본 가격 설정 반환"""
    return {
        "services": {
            "qname": {
                "name": "Q네임", 
                "unit_price": DEFAULT_QNAME_PRICE, 
                "description": "상품명 생성 서비스", 
                "unit": "건당", 
                "is_active": True
            },
            "qtext": {
                "name": "Q텍스트", 
                "unit_price": DEFAULT_QTEXT_PRICE, 
                "description": "텍스트 추출 서비스", 
                "unit": "건당", 
                "is_active": True
            },
            "qcapture": {
                "name": "Q캡쳐", 
                "unit_price": DEFAULT_QCAPTURE_PRICE, 
                "description": "스크린샷 캡쳐 서비스", 
                "unit": "건당", 
                "is_active": True
            }
        },
        "last_updated": datetime.now().isoformat(),
        "updated_by": "system"
    }

def load_pricing_from_file():
    """파일에서 가격 설정 로드 (로컬 개발용)"""
    try:
        if os.path.exists(PRICING_CONFIG_PATH):
            with open(PRICING_CONFIG_PATH, 'r', encoding='utf-8') as f:
                return json.load(f), "file"
    except Exception as e:
        print(f"파일 로드 실패: {e}")
    return None, None

def save_pricing_to_file(config: dict):
    """파일에 가격 설정 저장 (로컬 개발용)"""
    try:
        os.makedirs(os.path.dirname(PRICING_CONFIG_PATH), exist_ok=True)
        with open(PRICING_CONFIG_PATH, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"파일 저장 실패: {e}")
        return False

def load_pricing_from_database(db: Session):
    """데이터베이스에서 가격 설정 로드"""
    try:
        from models.pricing import PricingPolicy
        
        # 활성화된 가격 정책 조회
        policies = db.query(PricingPolicy).filter(
            PricingPolicy.is_active == True
        ).all()
        
        if policies:
            config = get_default_config()
            
            # 데이터베이스의 정책으로 업데이트
            for policy in policies:
                if policy.service_type in config["services"]:
                    config["services"][policy.service_type]["unit_price"] = policy.unit_price
                    config["services"][policy.service_type]["name"] = policy.name
                    if policy.description:
                        config["services"][policy.service_type]["description"] = policy.description
            
            # 가장 최근 업데이트 시간 사용
            latest_policy = max(policies, key=lambda x: x.updated_at)
            config["last_updated"] = latest_policy.updated_at.isoformat()
            config["updated_by"] = "database"
            
            return config, "database"
    except Exception as e:
        print(f"데이터베이스 로드 실패: {e}")
    return None, None

def save_pricing_to_database(config: dict, db: Session, current_user: User):
    """데이터베이스에 가격 설정 저장"""
    try:
        from models.pricing import PricingPolicy
        
        for service_type, service_data in config["services"].items():
            # 기존 정책 비활성화
            existing_policies = db.query(PricingPolicy).filter(
                PricingPolicy.service_type == service_type,
                PricingPolicy.is_active == True
            ).all()
            
            for policy in existing_policies:
                policy.is_active = False
            
            # 새 정책 생성
            new_policy = PricingPolicy(
                service_type=service_type,
                name=service_data["name"],
                unit_price=service_data["unit_price"],
                description=service_data.get("description", ""),
                min_count=1,
                is_active=True
            )
            
            db.add(new_policy)
        
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"데이터베이스 저장 실패: {e}")
        return False

def load_pricing_config(db: Session = None):
    """가격 설정 로드 (우선순위: 데이터베이스 > 파일 > 기본값)"""
    # 1. 데이터베이스에서 로드 시도
    if db:
        config, source = load_pricing_from_database(db)
        if config:
            return config, source
    
    # 2. 파일에서 로드 시도
    config, source = load_pricing_from_file()
    if config:
        return config, source
    
    # 3. 기본값 반환
    return get_default_config(), "env"

def save_pricing_config(config: dict, db: Session = None, current_user: User = None):
    """가격 설정 저장 (데이터베이스 우선, 파일 백업)"""
    success = False
    
    # 1. 데이터베이스에 저장 시도
    if db and current_user:
        success = save_pricing_to_database(config, db, current_user)
    
    # 2. 파일에 백업 저장 (로컬 개발용)
    file_success = save_pricing_to_file(config)
    
    return success or file_success

@router.get("/simple-pricing", response_model=PricingResponse)
async def get_simple_pricing(db: Session = Depends(get_db)):
    """현재 서비스 가격 조회 (모든 사용자)"""
    config, source = load_pricing_config(db)
    return PricingResponse(**config, source=source)

@router.get("/simple-pricing/{service_type}")
async def get_service_price(service_type: str, db: Session = Depends(get_db)):
    """특정 서비스 가격 조회"""
    config, source = load_pricing_config(db)
    if service_type not in config["services"]:
        raise HTTPException(status_code=404, detail="서비스를 찾을 수 없습니다")
    
    service_data = config["services"][service_type].copy()
    service_data["source"] = source
    return service_data

@router.put("/simple-pricing/{service_type}")
async def update_service_price(
    service_type: str,
    price_update: ServicePriceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """서비스 가격 업데이트 (관리자 전용)"""
    config, source = load_pricing_config(db)
    
    if service_type not in config["services"]:
        raise HTTPException(status_code=404, detail="서비스를 찾을 수 없습니다")
    
    # 가격 업데이트
    old_price = config["services"][service_type]["unit_price"]
    config["services"][service_type]["unit_price"] = price_update.unit_price
    
    if price_update.description is not None:
        config["services"][service_type]["description"] = price_update.description
    
    if price_update.is_active is not None:
        config["services"][service_type]["is_active"] = price_update.is_active
    
    # 업데이트 정보 기록
    config["last_updated"] = datetime.now().isoformat()
    config["updated_by"] = current_user.email
    
    # 설정 저장
    save_success = save_pricing_config(config, db, current_user)
    
    if not save_success:
        raise HTTPException(status_code=500, detail="가격 설정 저장에 실패했습니다")
    
    return {
        "message": f"{service_type} 서비스 가격이 {old_price}원에서 {price_update.unit_price}원으로 업데이트되었습니다",
        "service": config["services"][service_type],
        "source": "database" if db else "file"
    }

@router.post("/simple-pricing/reset")
async def reset_pricing_to_default(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """가격을 기본값으로 초기화 (관리자 전용)"""
    default_config = get_default_config()
    default_config["updated_by"] = current_user.email
    
    save_success = save_pricing_config(default_config, db, current_user)
    
    if not save_success:
        raise HTTPException(status_code=500, detail="가격 초기화에 실패했습니다")
    
    return {
        "message": "모든 서비스 가격이 기본값으로 초기화되었습니다",
        "config": default_config,
        "source": "database" if db else "file"
    }

@router.get("/simple-pricing/status")
async def get_pricing_status(db: Session = Depends(get_db)):
    """가격 관리 시스템 상태 확인"""
    config, source = load_pricing_config(db)
    
    return {
        "source": source,
        "database_available": db is not None,
        "file_available": os.path.exists(PRICING_CONFIG_PATH),
        "environment_variables": {
            "DEFAULT_QNAME_PRICE": DEFAULT_QNAME_PRICE,
            "DEFAULT_QTEXT_PRICE": DEFAULT_QTEXT_PRICE,
            "DEFAULT_QCAPTURE_PRICE": DEFAULT_QCAPTURE_PRICE
        },
        "last_updated": config["last_updated"],
        "updated_by": config["updated_by"]
    } 