#!/usr/bin/env python3
"""
로컬 회원가입 기능 테스트 스크립트
"""

import requests
import json
import sys

# API 설정 (로컬)
API_BASE_URL = "http://localhost:8001"
SIGNUP_URL = f"{API_BASE_URL}/api/auth/signup"

def test_signup():
    """회원가입 테스트"""
    
    # 테스트 데이터
    test_user = {
        "userId": "testuser123",
        "name": "테스트 사용자",
        "email": "test123@example.com",
        "password": "Test123@",
        "phone": "010-1234-5678",
        "region": "서울특별시",
        "age": "25",
        "gender": "남성",
        "workType": "회사원",
        "hasBusiness": False,
        "businessNumber": ""
    }
    
    print(f"회원가입 테스트 시작...")
    print(f"API URL: {SIGNUP_URL}")
    print(f"테스트 데이터: {json.dumps(test_user, indent=2, ensure_ascii=False)}")
    
    try:
        # 회원가입 요청
        response = requests.post(
            SIGNUP_URL,
            json=test_user,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"\n응답 상태 코드: {response.status_code}")
        print(f"응답 헤더: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ 회원가입 성공!")
            print(f"응답 데이터: {json.dumps(data, indent=2, ensure_ascii=False)}")
            return True
        else:
            print(f"\n❌ 회원가입 실패")
            try:
                error_data = response.json()
                print(f"에러 응답: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
            except:
                print(f"에러 응답 (텍스트): {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ 네트워크 오류: {e}")
        return False
    except Exception as e:
        print(f"\n❌ 예상치 못한 오류: {e}")
        return False

def test_users_list():
    """사용자 목록 조회 테스트"""
    USERS_URL = f"{API_BASE_URL}/debug/users"
    
    print(f"\n사용자 목록 조회 테스트...")
    print(f"API URL: {USERS_URL}")
    
    try:
        response = requests.get(USERS_URL, timeout=30)
        
        print(f"응답 상태 코드: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 사용자 목록 조회 성공!")
            print(f"총 사용자 수: {data.get('count', 0)}")
            print(f"사용자 목록: {json.dumps(data.get('users', []), indent=2, ensure_ascii=False)}")
            return True
        else:
            print(f"❌ 사용자 목록 조회 실패")
            print(f"에러 응답: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ 사용자 목록 조회 중 오류: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("로컬 회원가입 및 사용자 목록 조회 테스트")
    print("=" * 60)
    
    # 회원가입 테스트
    signup_success = test_signup()
    
    if signup_success:
        print("\n" + "=" * 60)
        # 사용자 목록 조회 테스트
        test_users_list()
    
    print("\n" + "=" * 60)
    if signup_success:
        print("✅ 회원가입 테스트가 성공했습니다.")
    else:
        print("⚠️ 회원가입 테스트가 실패했습니다.")
    print("=" * 60) 