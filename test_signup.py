#!/usr/bin/env python3
"""
회원가입 기능 테스트 스크립트
"""

import requests
import json
import sys

# API 설정
API_BASE_URL = "https://nadaeri-250629-production.up.railway.app"
SIGNUP_URL = f"{API_BASE_URL}/api/auth/signup"

def test_signup():
    """회원가입 테스트"""
    
    # 테스트 데이터
    test_user = {
        "userId": "testuser123",
        "name": "테스트 사용자",
        "email": "test123@example.com",
        "password": "Test123!@#"
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

def test_login():
    """로그인 테스트"""
    
    LOGIN_URL = f"{API_BASE_URL}/api/auth/login"
    
    # 테스트 데이터
    test_credentials = {
        "username": "testuser123",  # userId 또는 email
        "password": "Test123!@#"
    }
    
    print(f"\n로그인 테스트 시작...")
    print(f"API URL: {LOGIN_URL}")
    print(f"테스트 데이터: {json.dumps(test_credentials, indent=2, ensure_ascii=False)}")
    
    try:
        # 로그인 요청 (form-data 형식)
        response = requests.post(
            LOGIN_URL,
            data=test_credentials,  # form-data로 전송
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=30
        )
        
        print(f"\n응답 상태 코드: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ 로그인 성공!")
            print(f"응답 데이터: {json.dumps(data, indent=2, ensure_ascii=False)}")
            return True
        else:
            print(f"\n❌ 로그인 실패")
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

if __name__ == "__main__":
    print("=" * 60)
    print("회원가입 및 로그인 기능 테스트")
    print("=" * 60)
    
    # 회원가입 테스트
    signup_success = test_signup()
    
    if signup_success:
        # 잠시 대기
        import time
        print("\n3초 후 로그인 테스트를 진행합니다...")
        time.sleep(3)
        
        # 로그인 테스트
        login_success = test_login()
        
        if login_success:
            print("\n🎉 모든 테스트가 성공했습니다!")
        else:
            print("\n⚠️ 로그인 테스트가 실패했습니다.")
    else:
        print("\n⚠️ 회원가입 테스트가 실패했습니다.")
    
    print("\n" + "=" * 60) 