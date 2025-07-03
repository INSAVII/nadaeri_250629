#!/usr/bin/env python3
"""
관리자 API 엔드포인트 테스트
"""

import requests
import json
import sys
import os

# API 기본 URL
BASE_URL = "http://localhost:8001"

def test_admin_login():
    """관리자 로그인 테스트"""
    try:
        login_data = {
            "username": "admin@qclick.com",  # OAuth2PasswordRequestForm 형식
            "password": "admin"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", data=login_data)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 관리자 로그인 성공")
            print(f"   토큰: {data['access_token'][:50]}...")
            return data['access_token']
        else:
            print(f"❌ 관리자 로그인 실패: {response.status_code}")
            print(f"   응답: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ 로그인 중 오류: {e}")
        return None

def test_admin_update_user_permissions(token, user_id="testdbuser"):
    """관리자 권한 업데이트 API 테스트"""
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # 권한 업데이트 요청
        update_data = {
            "user_id": user_id,
            "permissions": {
                "free": True,
                "month1": True,
                "month3": False
            }
        }
        
        print(f"🔍 관리자 API 테스트 - 사용자: {user_id}")
        print(f"   요청 데이터: {json.dumps(update_data, indent=2)}")
        
        response = requests.post(
            f"{BASE_URL}/api/auth/admin/update-user-program-permissions",
            headers=headers,
            json=update_data
        )
        
        print(f"   응답 상태: {response.status_code}")
        print(f"   응답 헤더: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 관리자 API 성공")
            print(f"   응답: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ 관리자 API 실패: {response.status_code}")
            print(f"   응답: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ API 테스트 중 오류: {e}")
        return False

def test_user_permissions_after_update(token, user_id="testdbuser"):
    """업데이트 후 사용자 권한 확인"""
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # 사용자 정보 조회 (관리자 권한으로)
        response = requests.get(
            f"{BASE_URL}/api/deposits/users?skip=0&limit=100",
            headers=headers
        )
        
        if response.status_code == 200:
            users = response.json()
            target_user = None
            
            for user in users:
                if user.get('id') == user_id:
                    target_user = user
                    break
            
            if target_user:
                print(f"✅ 사용자 {user_id} 정보 조회 성공")
                print(f"   프로그램 권한:")
                print(f"     - Free: {target_user.get('program_permissions_free', False)}")
                print(f"     - Month1: {target_user.get('program_permissions_month1', False)}")
                print(f"     - Month3: {target_user.get('program_permissions_month3', False)}")
                return True
            else:
                print(f"❌ 사용자 {user_id}를 찾을 수 없습니다")
                return False
        else:
            print(f"❌ 사용자 목록 조회 실패: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ 권한 확인 중 오류: {e}")
        return False

def main():
    print("🔍 관리자 API 엔드포인트 테스트 시작")
    
    # 1. 관리자 로그인
    token = test_admin_login()
    if not token:
        print("❌ 관리자 로그인 실패로 테스트 중단")
        return
    
    # 2. 관리자 권한 업데이트 API 테스트
    success = test_admin_update_user_permissions(token)
    if not success:
        print("❌ 관리자 권한 업데이트 API 실패")
        return
    
    # 3. 업데이트 후 권한 확인
    test_user_permissions_after_update(token)
    
    print("\n✅ 관리자 API 테스트 완료")

if __name__ == "__main__":
    main() 