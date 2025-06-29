from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from models.user import User
from models.pricing import PricingPolicy
from api.auth import get_current_active_user, get_current_admin_user

router = APIRouter()

# 요청/응답 모델
class PricingPolicyBase(BaseModel):
    service_type: str
    name: str
    base_price: float = 0
    unit_price: float
    min_count: int = 1
    max_count: Optional[int] = None

class PricingPolicyCreate(PricingPolicyBase):
    pass

class PricingPolicyResponse(PricingPolicyBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class PriceCalculationRequest(BaseModel):
    service_type: str
    item_count: int

# API 엔드포인트
@router.post("/policies", response_model=PricingPolicyResponse)
async def create_pricing_policy(
    policy_data: PricingPolicyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """가격 정책 생성 (관리자 전용)"""
    new_policy = PricingPolicy(
        service_type=policy_data.service_type,
        name=policy_data.name,
        base_price=policy_data.base_price,
        unit_price=policy_data.unit_price,
        min_count=policy_data.min_count,
        max_count=policy_data.max_count
    )
    
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)
    
    return new_policy

@router.get("/policies", response_model=List[PricingPolicyResponse])
async def get_pricing_policies(
    service_type: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """가격 정책 목록 조회"""
    query = db.query(PricingPolicy)
    
    if service_type:
        query = query.filter(PricingPolicy.service_type == service_type)
    
    if active_only:
        query = query.filter(PricingPolicy.is_active == True)
    
    policies = query.all()
    return policies

@router.get("/policies/{policy_id}", response_model=PricingPolicyResponse)
async def get_pricing_policy(
    policy_id: str,
    db: Session = Depends(get_db)
):
    """가격 정책 상세 조회"""
    policy = db.query(PricingPolicy).filter(PricingPolicy.id == policy_id).first()
    
    if not policy:
        raise HTTPException(status_code=404, detail="가격 정책을 찾을 수 없습니다")
    
    return policy

@router.put("/policies/{policy_id}", response_model=PricingPolicyResponse)
async def update_pricing_policy(
    policy_id: str,
    policy_data: PricingPolicyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """가격 정책 업데이트 (관리자 전용)"""
    policy = db.query(PricingPolicy).filter(PricingPolicy.id == policy_id).first()
    
    if not policy:
        raise HTTPException(status_code=404, detail="가격 정책을 찾을 수 없습니다")
    
    policy.service_type = policy_data.service_type
    policy.name = policy_data.name
    policy.base_price = policy_data.base_price
    policy.unit_price = policy_data.unit_price
    policy.min_count = policy_data.min_count
    policy.max_count = policy_data.max_count
    
    db.commit()
    db.refresh(policy)
    
    return policy

@router.put("/policies/{policy_id}/status")
async def toggle_pricing_policy_status(
    policy_id: str,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """가격 정책 활성화/비활성화 (관리자 전용)"""
    policy = db.query(PricingPolicy).filter(PricingPolicy.id == policy_id).first()
    
    if not policy:
        raise HTTPException(status_code=404, detail="가격 정책을 찾을 수 없습니다")
    
    policy.is_active = is_active
    db.commit()
    
    return {"success": True, "message": f"가격 정책이 {'활성화' if is_active else '비활성화'}되었습니다"}

@router.post("/calculate")
async def calculate_price(
    request: PriceCalculationRequest,
    db: Session = Depends(get_db)
):
    """가격 계산"""
    # 활성화된 정책 중 해당 수량에 적용 가능한 정책 검색
    policies = db.query(PricingPolicy).filter(
        PricingPolicy.service_type == request.service_type,
        PricingPolicy.is_active == True,
        PricingPolicy.min_count <= request.item_count
    ).all()
    
    valid_policies = []
    
    for policy in policies:
        if policy.max_count is None or policy.max_count >= request.item_count:
            valid_policies.append(policy)
    
    if not valid_policies:
        # 적용 가능한 정책이 없으면 기본 가격 반환
        return {"price": request.item_count * 50, "policy": None}  # 기본 단가 50원
    
    # 가장 저렴한 가격 정책 선택
    cheapest_price = float('inf')
    cheapest_policy = None
    
    for policy in valid_policies:
        price = policy.calculate_price(request.item_count)
        if price < cheapest_price:
            cheapest_price = price
            cheapest_policy = policy
    
    return {
        "price": cheapest_price,
        "policy": {
            "id": cheapest_policy.id,
            "name": cheapest_policy.name,
            "base_price": cheapest_policy.base_price,
            "unit_price": cheapest_policy.unit_price
        }
    }
