#!/usr/bin/env python3
"""
기본 가격 정책 초기화 스크립트
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
from models.pricing import PricingPolicy
from datetime import datetime
import uuid

def init_pricing_policies():
    """기본 가격 정책 생성"""
    db = next(get_db())
    
    # 기존 정책들 비활성화
    existing_policies = db.query(PricingPolicy).all()
    for policy in existing_policies:
        policy.is_active = False
    
    # 새로운 기본 정책들 생성
    default_policies = [
        {
            "service_type": "qcapture_free",
            "name": "QCapture 무료 서비스",
            "base_price": 0,
            "unit_price": 0,
            "min_count": 1,
            "max_count": 10
        },
        {
            "service_type": "qcapture_1month",
            "name": "QCapture 1개월 서비스",
            "base_price": 0,
            "unit_price": 100,
            "min_count": 1,
            "max_count": None
        },
        {
            "service_type": "qcapture_3month",
            "name": "QCapture 3개월 서비스",
            "base_price": 0,
            "unit_price": 80,
            "min_count": 1,
            "max_count": None
        },
        {
            "service_type": "qtext",
            "name": "QText 서비스",
            "base_price": 0,
            "unit_price": 200,
            "min_count": 1,
            "max_count": None
        },
        {
            "service_type": "qname",
            "name": "QName 서비스",
            "base_price": 0,
            "unit_price": 50,
            "min_count": 1,
            "max_count": None
        }
    ]
    
    for policy_data in default_policies:
        new_policy = PricingPolicy(
            id=str(uuid.uuid4()),
            service_type=policy_data["service_type"],
            name=policy_data["name"],
            base_price=policy_data["base_price"],
            unit_price=policy_data["unit_price"],
            min_count=policy_data["min_count"],
            max_count=policy_data["max_count"],
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(new_policy)
        print(f"✅ {policy_data['name']} 정책 생성됨 (가격: {policy_data['unit_price']}원)")
    
    db.commit()
    print("🎉 모든 기본 가격 정책이 성공적으로 생성되었습니다!")

if __name__ == "__main__":
    init_pricing_policies() 