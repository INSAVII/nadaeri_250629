#!/usr/bin/env python3
"""
완전한 API 테스트 스크립트 (목업 제거 후)
"""

import requests
import json
import sys
import time

# API 설정
API_BASE_URL = "http://localhost:8000"

def test_health_check():
    """서버 상태 확인"""
    print("🔍 서버 상태 확인...")
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=10)
        if response.status_code == 200:
            print("✅ 서버가 정상 작동 중입니다.")
            return True
        else:
            print(f"❌ 서버 상태 확인 실패: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 서버 연결 실패: {e}")
        return False

def test_admin_login():
    """관리자 로그인 테스트"""
    print("\n🔐 관리자 로그인 테스트...")
    
    login_data = {
        "username": "admin",  # userId
        "password": "admin"
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/auth/login",
            data=login_data,  # form-data
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10
        )
        
        print(f"응답 상태: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 관리자 로그인 성공!")
            print(f"   - User ID: {data['user']['user_id']}")
            print(f"   - Email: {data['user']['email']}")
            print(f"   - Role: {data['user']['is_admin']}")
            print(f"   - Balance: {data['user']['balance']:,}원")
            print(f"   - Token: {data['access_token'][:20]}...")
            return data['access_token']
        else:
            print(f"❌ 관리자 로그인 실패")
            try:
                error_data = response.json()
                print(f"   - 에러: {error_data}")
            except:
                print(f"   - 에러: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ 로그인 요청 실패: {e}")
        return None

def test_user_signup():
    """일반 사용자 회원가입 테스트"""
    print("\n📝 일반 사용자 회원가입 테스트...")
    
    signup_data = {
        "userId": "testuser123",
        "name": "테스트 사용자",
        "email": "testuser123@example.com",
        "password": "Test123!@#"
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/auth/signup",
            json=signup_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"응답 상태: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 회원가입 성공!")
            print(f"   - User ID: {data['user']['user_id']}")
            print(f"   - Email: {data['user']['email']}")
            print(f"   - Name: {data['user']['name']}")
            print(f"   - Balance: {data['user']['balance']:,}원")
            return data['access_token']
        else:
            print(f"❌ 회원가입 실패")
            try:
                error_data = response.json()
                print(f"   - 에러: {error_data}")
            except:
                print(f"   - 에러: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ 회원가입 요청 실패: {e}")
        return None

def test_user_login():
    """일반 사용자 로그인 테스트"""
    print("\n🔐 일반 사용자 로그인 테스트...")
    
    login_data = {
        "username": "testuser123",
        "password": "Test123!@#"
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10
        )
        
        print(f"응답 상태: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 일반 사용자 로그인 성공!")
            print(f"   - User ID: {data['user']['user_id']}")
            print(f"   - Email: {data['user']['email']}")
            print(f"   - Role: {data['user']['is_admin']}")
            print(f"   - Balance: {data['user']['balance']:,}원")
            return data['access_token']
        else:
            print(f"❌ 일반 사용자 로그인 실패")
            try:
                error_data = response.json()
                print(f"   - 에러: {error_data}")
            except:
                print(f"   - 에러: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ 로그인 요청 실패: {e}")
        return None

def test_user_info(token):
    """사용자 정보 조회 테스트"""
    print(f"\n👤 사용자 정보 조회 테스트...")
    
    try:
        response = requests.get(
            f"{API_BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        print(f"응답 상태: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 사용자 정보 조회 성공!")
            print(f"   - User ID: {data['user_id']}")
            print(f"   - Email: {data['email']}")
            print(f"   - Name: {data['name']}")
            print(f"   - Role: {data['is_admin']}")
            print(f"   - Balance: {data['balance']:,}원")
            return True
        else:
            print(f"❌ 사용자 정보 조회 실패")
            try:
                error_data = response.json()
                print(f"   - 에러: {error_data}")
            except:
                print(f"   - 에러: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ 사용자 정보 조회 요청 실패: {e}")
        return False

def test_admin_check(token):
    """관리자 권한 확인 테스트"""
    print(f"\n👑 관리자 권한 확인 테스트...")
    
    try:
        response = requests.get(
            f"{API_BASE_URL}/api/auth/check-admin",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        print(f"응답 상태: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 관리자 권한 확인 성공!")
            print(f"   - Is Admin: {data['isAdmin']}")
            return data['isAdmin']
        else:
            print(f"❌ 관리자 권한 확인 실패")
            try:
                error_data = response.json()
                print(f"   - 에러: {error_data}")
            except:
                print(f"   - 에러: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ 관리자 권한 확인 요청 실패: {e}")
        return False

def test_debug_users():
    """디버그: 모든 사용자 목록 조회"""
    print(f"\n📋 모든 사용자 목록 조회...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/debug/users", timeout=10)
        
        print(f"응답 상태: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 사용자 목록 조회 성공!")
            print(f"   - 총 사용자 수: {data['count']}명")
            for user in data['users']:
                print(f"     * {user['name']} ({user['email']}) - {user['role']}")
            return True
        else:
            print(f"❌ 사용자 목록 조회 실패")
            return False
            
    except Exception as e:
        print(f"❌ 사용자 목록 조회 요청 실패: {e}")
        return False

if __name__ == "__main__":
    print("=" * 80)
    print("완전한 API 테스트 (목업 제거 후)")
    print("=" * 80)
    
    # 서버 상태 확인
    if not test_health_check():
        print("\n❌ 서버가 실행되지 않았습니다. 백엔드 서버를 먼저 실행해주세요.")
        sys.exit(1)
    
    # 잠시 대기
    print("\n⏳ 3초 후 테스트를 시작합니다...")
    time.sleep(3)
    
    # 1. 관리자 로그인 테스트
    admin_token = test_admin_login()
    
    if admin_token:
        # 2. 관리자 정보 조회
        test_user_info(admin_token)
        
        # 3. 관리자 권한 확인
        test_admin_check(admin_token)
    
    # 4. 일반 사용자 회원가입
    user_token = test_user_signup()
    
    if user_token:
        # 5. 일반 사용자 로그인
        user_token = test_user_login()
        
        if user_token:
            # 6. 일반 사용자 정보 조회
            test_user_info(user_token)
            
            # 7. 일반 사용자 관리자 권한 확인
            test_admin_check(user_token)
    
    # 8. 디버그: 모든 사용자 목록
    test_debug_users()
    
    print("\n" + "=" * 80)
    print("🎉 API 테스트 완료!")
    print("=" * 80) 