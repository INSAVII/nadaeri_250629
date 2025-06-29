from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import json
import os
from datetime import datetime
from pydantic import BaseModel

router = APIRouter()

# 홍보문구 스타일 모델
class PromotionStyle(BaseModel):
    text: str
    fontSize: str = "normal"  # small, normal, large
    color: str = "default"    # default, blue, red, green
    fontWeight: str = "normal"  # normal, bold

# 홍보문구 데이터 모델
class PromotionData(BaseModel):
    promotion: PromotionStyle

# 홍보문구 저장 파일 경로
PROMOTION_FILE = "promotion_data.json"

def get_promotion_data():
    """홍보문구 데이터 조회"""
    if os.path.exists(PROMOTION_FILE):
        try:
            with open(PROMOTION_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # 이전 버전 호환성 처리
                if 'text' in data and 'promotion' not in data:
                    return {
                        "promotion": {
                            "text": data.get("text", "대량가공판매자님을위한 상품명짖기, 목록이미지캡쳐 자동저장, 카테번호, 키워드추출 자동화"),
                            "fontSize": "normal",
                            "color": "default",
                            "fontWeight": "normal"
                        },
                        "updated_at": data.get("updated_at", datetime.now().isoformat())
                    }
                return data
        except:
            pass
    
    # 기본값 반환
    return {
        "promotion": {
            "text": "대량가공판매자님을위한 상품명짖기, 목록이미지캡쳐 자동저장, 카테번호, 키워드추출 자동화",
            "fontSize": "normal",
            "color": "default",
            "fontWeight": "normal"
        },
        "updated_at": datetime.now().isoformat()
    }

def save_promotion_data(promotion: dict):
    """홍보문구 데이터 저장"""
    data = {
        "promotion": promotion,
        "updated_at": datetime.now().isoformat()
    }
    with open(PROMOTION_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return data

@router.get("/current")
async def get_current_promotion():
    """현재 홍보문구 조회"""
    try:
        data = get_promotion_data()
        return {
            "success": True,
            "promotion": data["promotion"],
            "updated_at": data.get("updated_at")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"홍보문구 조회 실패: {str(e)}")

@router.post("/publish")
async def publish_promotion(promotion_data: PromotionData):
    """홍보문구 게시 (사이트 적용)"""
    try:
        promotion = promotion_data.promotion
        
        if not promotion.text.strip():
            raise HTTPException(status_code=400, detail="홍보문구를 입력해주세요")
        
        if len(promotion.text) > 500:
            raise HTTPException(status_code=400, detail="홍보문구는 500자를 초과할 수 없습니다")
        
        # 유효한 값인지 검증
        valid_font_sizes = ["small", "normal", "large"]
        valid_colors = ["default", "blue", "red", "green"]
        valid_font_weights = ["normal", "bold"]
        
        if promotion.fontSize not in valid_font_sizes:
            promotion.fontSize = "normal"
        if promotion.color not in valid_colors:
            promotion.color = "default"
        if promotion.fontWeight not in valid_font_weights:
            promotion.fontWeight = "normal"
        
        data = save_promotion_data(promotion.dict())
        
        return {
            "success": True,
            "message": "홍보문구가 성공적으로 적용되었습니다",
            "promotion": data["promotion"],
            "updated_at": data["updated_at"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"홍보문구 적용 실패: {str(e)}")
