#!/usr/bin/env python3
"""
회원가입 및 로그인 기능 테스트 스크립트 (리팩터링 버전)
"""

import requests
import json
import sys
import time

# API 설정
API_BASE_URL = "https://nadaeri-250629-production.up.railway.app"
SIGNUP_URL = f"{API_BASE_URL}/api/auth/signup"
LOGIN_URL = f"{API_BASE_URL}/api/auth/login"
ME_URL = f"{API_BASE_URL}/api/auth/me"

def test_api_health():
    """API 서버 상태 확인"""
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=10)
        if response.status_code == 200:
            print("✅ API 서버 정상 작동")
            return True
        else:
            print(f"❌ API 서버 오류: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API 서버 연결 실패: {e}")
        return False

def test_signup():
    """회원가입 테스트"""
    
    # 테스트 데이터
    test_user = {
        "userId": f"testuser_{int(time.time())}",
        "name": "테스트 사용자",
        "email": f"test{int(time.time())}@example.com",
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
            return test_user, data.get("access_token")
        else:
            print(f"\n❌ 회원가입 실패")
            try:
                error_data = response.json()
                print(f"에러 응답: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
            except:
                print(f"에러 응답 (텍스트): {response.text}")
            return None, None
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ 네트워크 오류: {e}")
        return None, None
    except Exception as e:
        print(f"\n❌ 예상치 못한 오류: {e}")
        return None, None

def test_login(user_data):
    """로그인 테스트"""
    
    print(f"\n로그인 테스트 시작...")
    print(f"API URL: {LOGIN_URL}")
    print(f"테스트 데이터: {json.dumps({'username': user_data['userId'], 'password': user_data['password']}, indent=2, ensure_ascii=False)}")
    
    try:
        # 로그인 요청 (form-data 형식)
        response = requests.post(
            LOGIN_URL,
            data={
                "username": user_data["userId"],
                "password": user_data["password"]
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=30
        )
        
        print(f"\n응답 상태 코드: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ 로그인 성공!")
            print(f"응답 데이터: {json.dumps(data, indent=2, ensure_ascii=False)}")
            return data.get("access_token")
        else:
            print(f"\n❌ 로그인 실패")
            try:
                error_data = response.json()
                print(f"에러 응답: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
            except:
                print(f"에러 응답 (텍스트): {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ 네트워크 오류: {e}")
        return None
    except Exception as e:
        print(f"\n❌ 예상치 못한 오류: {e}")
        return None

def test_user_info(access_token):
    """사용자 정보 조회 테스트"""
    
    print(f"\n사용자 정보 조회 테스트 시작...")
    print(f"API URL: {ME_URL}")
    
    try:
        # 사용자 정보 조회
        response = requests.get(
            ME_URL,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            },
            timeout=30
        )
        
        print(f"\n응답 상태 코드: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ 사용자 정보 조회 성공!")
            print(f"응답 데이터: {json.dumps(data, indent=2, ensure_ascii=False)}")
            return True
        else:
            print(f"\n❌ 사용자 정보 조회 실패")
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

def test_admin_login():
    """관리자 로그인 테스트"""
    
    admin_credentials = {
        "username": "admin",
        "password": "admin123!"
    }
    
    print(f"\n관리자 로그인 테스트 시작...")
    print(f"API URL: {LOGIN_URL}")
    print(f"테스트 데이터: {json.dumps(admin_credentials, indent=2, ensure_ascii=False)}")
    
    try:
        response = requests.post(
            LOGIN_URL,
            data=admin_credentials,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=30
        )
        
        print(f"\n응답 상태 코드: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ 관리자 로그인 성공!")
            print(f"사용자 역할: {data.get('user', {}).get('role', 'unknown')}")
            return data.get("access_token")
        else:
            print(f"\n❌ 관리자 로그인 실패")
            try:
                error_data = response.json()
                print(f"에러 응답: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
            except:
                print(f"에러 응답 (텍스트): {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ 네트워크 오류: {e}")
        return None
    except Exception as e:
        print(f"\n❌ 예상치 못한 오류: {e}")
        return None

if __name__ == "__main__":
    print("=" * 60)
    print("회원가입 및 로그인 기능 테스트 (리팩터링 버전)")
    print("=" * 60)
    
    # 1. API 서버 상태 확인
    if not test_api_health():
        print("\n❌ API 서버가 응답하지 않습니다. 배포 상태를 확인해주세요.")
        sys.exit(1)
    
    # 2. 관리자 로그인 테스트
    admin_token = test_admin_login()
    if admin_token:
        print("\n✅ 관리자 계정이 정상적으로 작동합니다.")
    else:
        print("\n⚠️ 관리자 계정 로그인에 실패했습니다.")
    
    # 3. 회원가입 테스트
    user_data, signup_token = test_signup()
    
    if user_data and signup_token:
        # 4. 로그인 테스트
        login_token = test_login(user_data)
        
        if login_token:
            # 5. 사용자 정보 조회 테스트
            user_info_success = test_user_info(login_token)
            
            if user_info_success:
                print("\n🎉 모든 테스트가 성공했습니다!")
                print(f"생성된 사용자: {user_data['userId']}")
                print(f"이메일: {user_data['email']}")
            else:
                print("\n⚠️ 사용자 정보 조회 테스트가 실패했습니다.")
        else:
            print("\n⚠️ 로그인 테스트가 실패했습니다.")
    else:
        print("\n⚠️ 회원가입 테스트가 실패했습니다.")
    
    print("\n" + "=" * 60)
    print("테스트 완료!")
    print("=" * 60) 