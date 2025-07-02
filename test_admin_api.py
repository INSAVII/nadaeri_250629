#!/usr/bin/env python3
import requests
import json
import sys
import os

# API 기본 URL
API_BASE_URL = "http://localhost:8001"

def test_admin_login():
    """admin 계정 로그인 테스트"""
    print("=== Admin 계정 로그인 테스트 ===")
    
    login_data = {
        "username": "admin",
        "password": "admin"
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 로그인 성공!")
            print(f"Access Token: {data.get('access_token', 'N/A')[:20]}...")
            
            user = data.get('user', {})
            print(f"User ID: {user.get('id')}")
            print(f"User Email: {user.get('email')}")
            print(f"User Role: {user.get('role')}")
            print(f"User Name: {user.get('name')}")
            print(f"Is Active: {user.get('is_active')}")
            print(f"Balance: {user.get('balance')}")
            
            # role 검증
            if user.get('role') == 'admin':
                print("✅ Role이 올바르게 'admin'으로 반환됨")
            else:
                print(f"❌ Role이 잘못됨: {user.get('role')}")
            
            return data.get('access_token')
        else:
            print(f"❌ 로그인 실패: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("❌ 백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.")
        return None
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return None

def test_admin_check(token):
    """admin 권한 확인 테스트"""
    if not token:
        print("토큰이 없어서 admin 권한 확인을 건너뜁니다.")
        return
    
    print("\n=== Admin 권한 확인 테스트 ===")
    
    try:
        response = requests.get(
            f"{API_BASE_URL}/api/auth/check-admin",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Admin 권한 확인 성공!")
            print(f"Is Admin: {data.get('is_admin')}")
            print(f"User ID: {data.get('user_id')}")
            print(f"Email: {data.get('email')}")
        else:
            print(f"❌ Admin 권한 확인 실패: {response.text}")
            
    except Exception as e:
        print(f"❌ 오류 발생: {e}")

def test_cms_users(token):
    """CMS 사용자 목록 조회 테스트"""
    if not token:
        print("토큰이 없어서 CMS 테스트를 건너뜁니다.")
        return
    
    print("\n=== CMS 사용자 목록 조회 테스트 ===")
    
    try:
        response = requests.get(
            f"{API_BASE_URL}/api/deposits/users",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            users = response.json()
            print(f"✅ 사용자 목록 조회 성공! 총 {len(users)}명")
            
            for user in users[:3]:  # 처음 3명만 출력
                print(f"  - ID: {user.get('id')}, Email: {user.get('email')}, Role: {user.get('role')}")
        else:
            print(f"❌ 사용자 목록 조회 실패: {response.text}")
            
    except Exception as e:
        print(f"❌ 오류 발생: {e}")

def test_logout_simulation():
    """로그아웃 시뮬레이션 테스트"""
    print("\n=== 로그아웃 시뮬레이션 테스트 ===")
    
    # 1. 로그인
    token = test_admin_login()
    if not token:
        return
    
    # 2. 로그아웃 (토큰 무효화 시뮬레이션)
    print("\n--- 로그아웃 후 재로그인 테스트 ---")
    
    # 3. 재로그인
    token2 = test_admin_login()
    if token2:
        print("✅ 재로그인 성공!")
        if token2 != token:
            print("✅ 새로운 토큰이 발급됨")
        else:
            print("⚠️ 동일한 토큰이 재사용됨")
    else:
        print("❌ 재로그인 실패")

if __name__ == "__main__":
    print("Admin 계정 API 테스트 시작")
    print(f"API Base URL: {API_BASE_URL}")
    print("=" * 50)
    
    # 1. 로그인 테스트
    token = test_admin_login()
    
    # 2. Admin 권한 확인
    test_admin_check(token)
    
    # 3. CMS 사용자 목록 조회
    test_cms_users(token)
    
    # 4. 로그아웃/재로그인 테스트
    test_logout_simulation()
    
    print("\n" + "=" * 50)
    print("테스트 완료") 