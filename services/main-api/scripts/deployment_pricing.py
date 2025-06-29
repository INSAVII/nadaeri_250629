#!/usr/bin/env python3
"""
배포 환경용 가격 관리 스크립트
환경변수와 데이터베이스를 활용하여 가격을 관리합니다.
"""

import os
import sys
import requests
import json
from datetime import datetime
from pathlib import Path

# 프로젝트 루트 경로 설정
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent

# API 기본 URL (환경변수에서 가져오거나 기본값 사용)
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8001")

def get_auth_token(email, password):
    """관리자 토큰 획득"""
    try:
        response = requests.post(f"{API_BASE_URL}/api/auth/login", data={
            "username": email,
            "password": password
        })
        
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            print(f"❌ 로그인 실패: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ 로그인 오류: {e}")
        return None

def get_current_pricing(token=None):
    """현재 가격 정보 조회"""
    try:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        response = requests.get(f"{API_BASE_URL}/api/simple-pricing", headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ 가격 정보 조회 실패: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ 가격 정보 조회 오류: {e}")
        return None

def update_service_price(service_type, new_price, token):
    """서비스 가격 업데이트"""
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        data = {
            "unit_price": new_price
        }
        
        response = requests.put(
            f"{API_BASE_URL}/api/simple-pricing/{service_type}",
            headers=headers,
            json=data
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ {result['message']}")
            return True
        else:
            print(f"❌ 가격 업데이트 실패: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 가격 업데이트 오류: {e}")
        return False

def reset_all_prices(token):
    """모든 가격을 기본값으로 초기화"""
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            f"{API_BASE_URL}/api/simple-pricing/reset",
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ {result['message']}")
            return True
        else:
            print(f"❌ 가격 초기화 실패: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 가격 초기화 오류: {e}")
        return False

def get_system_status():
    """시스템 상태 확인"""
    try:
        response = requests.get(f"{API_BASE_URL}/api/simple-pricing/status")
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ 상태 확인 실패: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ 상태 확인 오류: {e}")
        return None

def show_current_prices():
    """현재 가격 표시"""
    print("\n=== 현재 서비스 가격 ===")
    
    # 시스템 상태 확인
    status = get_system_status()
    if status:
        print(f"데이터 소스: {status['source']}")
        print(f"데이터베이스 사용 가능: {status['database_available']}")
        print(f"파일 시스템 사용 가능: {status['file_available']}")
        print()
    
    # 현재 가격 정보 조회
    pricing_data = get_current_pricing()
    if not pricing_data:
        print("❌ 가격 정보를 가져올 수 없습니다.")
        return
    
    print(f"마지막 업데이트: {pricing_data['last_updated']}")
    print(f"업데이트한 사람: {pricing_data['updated_by']}")
    print()
    
    for service_key, service_data in pricing_data['services'].items():
        status = "활성" if service_data['is_active'] else "비활성"
        print(f"{service_data['name']} ({service_key}): {service_data['unit_price']:,}원/{service_data['unit']} [{status}]")
        print(f"  설명: {service_data['description']}")
        print()

def interactive_mode():
    """대화형 모드"""
    print("\n=== QClick 가격 관리 시스템 (배포 환경용) ===")
    
    # 관리자 계정 정보 입력
    admin_email = input("관리자 이메일: ").strip()
    admin_password = input("관리자 비밀번호: ").strip()
    
    if not admin_email or not admin_password:
        print("❌ 관리자 계정 정보가 필요합니다.")
        return
    
    # 토큰 획득
    token = get_auth_token(admin_email, admin_password)
    if not token:
        print("❌ 관리자 인증에 실패했습니다.")
        return
    
    print("✅ 관리자 인증 성공!")
    
    while True:
        print("\n=== 메뉴 ===")
        print("1. 현재 가격 확인")
        print("2. Q네임 가격 변경")
        print("3. Q텍스트 가격 변경")
        print("4. Q캡쳐 가격 변경")
        print("5. 모든 가격 초기화")
        print("6. 시스템 상태 확인")
        print("0. 종료")
        
        choice = input("\n선택하세요: ").strip()
        
        if choice == "1":
            show_current_prices()
        
        elif choice == "2":
            try:
                new_price = int(input("새 Q네임 가격 (원): "))
                update_service_price("qname", new_price, token)
            except ValueError:
                print("❌ 유효한 숫자를 입력하세요.")
        
        elif choice == "3":
            try:
                new_price = int(input("새 Q텍스트 가격 (원): "))
                update_service_price("qtext", new_price, token)
            except ValueError:
                print("❌ 유효한 숫자를 입력하세요.")
        
        elif choice == "4":
            try:
                new_price = int(input("새 Q캡쳐 가격 (원): "))
                update_service_price("qcapture", new_price, token)
            except ValueError:
                print("❌ 유효한 숫자를 입력하세요.")
        
        elif choice == "5":
            confirm = input("정말로 모든 가격을 기본값으로 초기화하시겠습니까? (y/N): ")
            if confirm.lower() in ['y', 'yes']:
                reset_all_prices(token)
            else:
                print("취소되었습니다.")
        
        elif choice == "6":
            status = get_system_status()
            if status:
                print("\n=== 시스템 상태 ===")
                print(f"데이터 소스: {status['source']}")
                print(f"데이터베이스 사용 가능: {status['database_available']}")
                print(f"파일 시스템 사용 가능: {status['file_available']}")
                print(f"마지막 업데이트: {status['last_updated']}")
                print(f"업데이트한 사람: {status['updated_by']}")
                print("\n환경변수 설정:")
                for key, value in status['environment_variables'].items():
                    print(f"  {key}: {value}")
        
        elif choice == "0":
            print("종료합니다.")
            break
        
        else:
            print("❌ 잘못된 선택입니다.")

def show_help():
    """도움말 표시"""
    print("""
=== QClick 배포 환경용 가격 관리 스크립트 ===

사용법:
  python deployment_pricing.py [명령] [서비스] [가격]

명령:
  show                    - 현재 가격 표시
  update <서비스> <가격>   - 특정 서비스 가격 업데이트 (토큰 필요)
  reset                   - 모든 가격을 기본값으로 초기화 (토큰 필요)
  interactive             - 대화형 모드
  status                  - 시스템 상태 확인
  help                    - 이 도움말 표시

서비스:
  qname                   - Q네임 (상품명 생성)
  qtext                   - Q텍스트 (텍스트 추출)
  qcapture                - Q캡쳐 (스크린샷 캡쳐)

환경변수:
  API_BASE_URL           - API 서버 URL (기본값: http://localhost:8001)

예시:
  python deployment_pricing.py show
  python deployment_pricing.py update qname 75
  python deployment_pricing.py interactive
  python deployment_pricing.py status
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
            print("사용법: python deployment_pricing.py update <서비스> <가격>")
            return
        
        service_key = sys.argv[2]
        try:
            new_price = int(sys.argv[3])
            if new_price < 0:
                print("❌ 오류: 가격은 0 이상이어야 합니다.")
                return
            
            # 토큰이 필요하므로 대화형 모드로 안내
            print("❌ 가격 업데이트를 위해서는 관리자 인증이 필요합니다.")
            print("대화형 모드를 사용하세요: python deployment_pricing.py interactive")
            
        except ValueError:
            print("❌ 오류: 가격은 숫자여야 합니다.")
    
    elif command == "reset":
        print("❌ 가격 초기화를 위해서는 관리자 인증이 필요합니다.")
        print("대화형 모드를 사용하세요: python deployment_pricing.py interactive")
    
    elif command == "interactive":
        interactive_mode()
    
    elif command == "status":
        status = get_system_status()
        if status:
            print("\n=== 시스템 상태 ===")
            print(f"데이터 소스: {status['source']}")
            print(f"데이터베이스 사용 가능: {status['database_available']}")
            print(f"파일 시스템 사용 가능: {status['file_available']}")
            print(f"마지막 업데이트: {status['last_updated']}")
            print(f"업데이트한 사람: {status['updated_by']}")
            print("\n환경변수 설정:")
            for key, value in status['environment_variables'].items():
                print(f"  {key}: {value}")
    
    elif command == "help":
        show_help()
    
    else:
        print(f"❌ 알 수 없는 명령: {command}")
        show_help()

if __name__ == "__main__":
    main() 