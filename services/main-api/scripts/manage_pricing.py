#!/usr/bin/env python3
"""
간단한 가격 관리 스크립트
관리자가 명령줄에서 서비스 가격을 쉽게 관리할 수 있습니다.
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

# 프로젝트 루트 경로 설정
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
CONFIG_PATH = PROJECT_ROOT / "config" / "pricing.json"

def load_config():
    """가격 설정 파일 로드"""
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        # 기본 설정 생성
        default_config = {
            "services": {
                "qname": {
                    "name": "Q네임",
                    "unit_price": 50,
                    "description": "상품명 생성 서비스",
                    "unit": "건당",
                    "is_active": True
                },
                "qtext": {
                    "name": "Q텍스트",
                    "unit_price": 30,
                    "description": "텍스트 추출 서비스", 
                    "unit": "건당",
                    "is_active": True
                },
                "qcapture": {
                    "name": "Q캡쳐",
                    "unit_price": 100,
                    "description": "스크린샷 캡쳐 서비스",
                    "unit": "건당",
                    "is_active": True
                }
            },
            "last_updated": datetime.now().isoformat(),
            "updated_by": "script"
        }
        save_config(default_config)
        return default_config

def save_config(config):
    """가격 설정 파일 저장"""
    CONFIG_PATH.parent.mkdir(exist_ok=True)
    with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

def show_current_prices():
    """현재 가격 표시"""
    config = load_config()
    print("\n=== 현재 서비스 가격 ===")
    print(f"마지막 업데이트: {config['last_updated']}")
    print(f"업데이트한 사람: {config['updated_by']}")
    print()
    
    for service_key, service_data in config['services'].items():
        status = "활성" if service_data['is_active'] else "비활성"
        print(f"{service_data['name']} ({service_key}): {service_data['unit_price']:,}원/{service_data['unit']} [{status}]")
        print(f"  설명: {service_data['description']}")
        print()

def update_price(service_key, new_price):
    """가격 업데이트"""
    config = load_config()
    
    if service_key not in config['services']:
        print(f"❌ 오류: '{service_key}' 서비스를 찾을 수 없습니다.")
        print(f"사용 가능한 서비스: {', '.join(config['services'].keys())}")
        return False
    
    old_price = config['services'][service_key]['unit_price']
    config['services'][service_key]['unit_price'] = new_price
    config['last_updated'] = datetime.now().isoformat()
    config['updated_by'] = "script"
    
    save_config(config)
    
    print(f"✅ {config['services'][service_key]['name']} 가격이 {old_price:,}원에서 {new_price:,}원으로 업데이트되었습니다.")
    return True

def reset_to_default():
    """기본값으로 초기화"""
    config = load_config()
    old_config = config.copy()
    
    config['services']['qname']['unit_price'] = 50
    config['services']['qtext']['unit_price'] = 30
    config['services']['qcapture']['unit_price'] = 100
    config['last_updated'] = datetime.now().isoformat()
    config['updated_by'] = "script"
    
    save_config(config)
    
    print("✅ 모든 서비스 가격이 기본값으로 초기화되었습니다.")
    print("\n변경된 가격:")
    for service_key in ['qname', 'qtext', 'qcapture']:
        old_price = old_config['services'][service_key]['unit_price']
        new_price = config['services'][service_key]['unit_price']
        if old_price != new_price:
            print(f"  {config['services'][service_key]['name']}: {old_price:,}원 → {new_price:,}원")

def show_help():
    """도움말 표시"""
    print("""
=== QClick 서비스 가격 관리 스크립트 ===

사용법:
  python manage_pricing.py [명령] [서비스] [가격]

명령:
  show                    - 현재 가격 표시
  update <서비스> <가격>   - 특정 서비스 가격 업데이트
  reset                   - 모든 가격을 기본값으로 초기화
  help                    - 이 도움말 표시

서비스:
  qname                   - Q네임 (상품명 생성)
  qtext                   - Q텍스트 (텍스트 추출)
  qcapture                - Q캡쳐 (스크린샷 캡쳐)

예시:
  python manage_pricing.py show
  python manage_pricing.py update qname 75
  python manage_pricing.py update qtext 40
  python manage_pricing.py reset
""")

def main():
    if len(sys.argv) < 2:
        show_current_prices()
        return
    
    command = sys.argv[1].lower()
    
    if command == "show":
        show_current_prices()
    
    elif command == "update":
        if len(sys.argv) != 4:
            print("❌ 오류: update 명령은 서비스와 가격을 필요로 합니다.")
            print("사용법: python manage_pricing.py update <서비스> <가격>")
            return
        
        service_key = sys.argv[2]
        try:
            new_price = int(sys.argv[3])
            if new_price < 0:
                print("❌ 오류: 가격은 0 이상이어야 합니다.")
                return
            update_price(service_key, new_price)
        except ValueError:
            print("❌ 오류: 가격은 숫자여야 합니다.")
    
    elif command == "reset":
        confirm = input("정말로 모든 가격을 기본값으로 초기화하시겠습니까? (y/N): ")
        if confirm.lower() in ['y', 'yes']:
            reset_to_default()
        else:
            print("취소되었습니다.")
    
    elif command == "help":
        show_help()
    
    else:
        print(f"❌ 알 수 없는 명령: {command}")
        show_help()

if __name__ == "__main__":
    main() 