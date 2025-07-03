#!/usr/bin/env python3
"""
CMS 프로그램 권한 저장 테스트 스크립트
"""

import requests
import json
import sys

# API 설정
API_BASE_URL = "http://localhost:8001"
ADMIN_EMAIL = "admin@qclick.com"
ADMIN_PASSWORD = "admin"

def login_admin():
    """관리자 로그인"""
    try:
        # OAuth2PasswordRequestForm 형식으로 요청
        response = requests.post(f"{API_BASE_URL}/api/auth/login", data={
            "username": ADMIN_EMAIL,  # OAuth2PasswordRequestForm은 username 필드 사용
            "password": ADMIN_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            print(f"❌ 로그인 실패: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ 로그인 중 오류: {e}")
        return None

def get_users(token):
    """사용자 목록 조회"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_BASE_URL}/api/deposits/users", headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ 사용자 목록 조회 실패: {response.status_code}")
            print(response.text)
            return []
    except Exception as e:
        print(f"❌ 사용자 목록 조회 중 오류: {e}")
        return []

def update_program_permission(token, user_id, program_id, is_allowed):
    """프로그램 권한 업데이트"""
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        data = {
            "program_id": program_id,
            "is_allowed": is_allowed,
            "duration_months": 1 if program_id == "month1" else (3 if program_id == "month3" else None)
        }
        
        response = requests.post(
            f"{API_BASE_URL}/api/deposits/update-program-permission?user_id={user_id}",
            headers=headers,
            json=data
        )
        
        print(f"🔍 API 요청: {user_id} - {program_id} = {is_allowed}")
        print(f"🔍 요청 데이터: {data}")
        print(f"🔍 응답 상태: {response.status_code}")
        print(f"🔍 응답 내용: {response.text}")
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ 권한 업데이트 실패: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ 권한 업데이트 중 오류: {e}")
        return None

def check_user_permissions(token, user_id):
    """사용자 권한 확인"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_BASE_URL}/api/deposits/users", headers=headers)
        
        if response.status_code == 200:
            users = response.json()
            for user in users:
                if user["id"] == user_id:
                    print(f"🔍 사용자 {user_id} 현재 권한:")
                    print(f"  - Free: {user.get('program_permissions_free', False)}")
                    print(f"  - Month1: {user.get('program_permissions_month1', False)}")
                    print(f"  - Month3: {user.get('program_permissions_month3', False)}")
                    return user
        return None
    except Exception as e:
        print(f"❌ 권한 확인 중 오류: {e}")
        return None

def main():
    print("🚀 CMS 프로그램 권한 저장 테스트 시작")
    
    # 1. 관리자 로그인
    print("\n1️⃣ 관리자 로그인...")
    token = login_admin()
    if not token:
        print("❌ 관리자 로그인 실패")
        return
    
    print("✅ 관리자 로그인 성공")
    
    # 2. 사용자 목록 조회
    print("\n2️⃣ 사용자 목록 조회...")
    users = get_users(token)
    if not users:
        print("❌ 사용자 목록 조회 실패")
        return
    
    print(f"✅ 사용자 {len(users)}명 조회 성공")
    
    # 테스트할 사용자 선택 (admin이 아닌 첫 번째 사용자)
    test_user = None
    for user in users:
        if user["id"] != "admin":
            test_user = user
            break
    
    if not test_user:
        print("❌ 테스트할 사용자를 찾을 수 없습니다")
        return
    
    print(f"🎯 테스트 사용자: {test_user['name']} ({test_user['id']})")
    
    # 3. 현재 권한 확인
    print("\n3️⃣ 현재 권한 확인...")
    current_user = check_user_permissions(token, test_user["id"])
    
    # 4. 권한 업데이트 테스트
    print("\n4️⃣ 권한 업데이트 테스트...")
    
    # Free 권한을 true로 설정
    print("\n📝 Free 권한을 true로 설정...")
    result = update_program_permission(token, test_user["id"], "free", True)
    if result:
        print("✅ Free 권한 업데이트 성공")
    else:
        print("❌ Free 권한 업데이트 실패")
    
    # Month1 권한을 true로 설정
    print("\n📝 Month1 권한을 true로 설정...")
    result = update_program_permission(token, test_user["id"], "month1", True)
    if result:
        print("✅ Month1 권한 업데이트 성공")
    else:
        print("❌ Month1 권한 업데이트 실패")
    
    # Month3 권한을 false로 설정
    print("\n📝 Month3 권한을 false로 설정...")
    result = update_program_permission(token, test_user["id"], "month3", False)
    if result:
        print("✅ Month3 권한 업데이트 성공")
    else:
        print("❌ Month3 권한 업데이트 실패")
    
    # 5. 업데이트 후 권한 확인
    print("\n5️⃣ 업데이트 후 권한 확인...")
    updated_user = check_user_permissions(token, test_user["id"])
    
    if updated_user:
        print("✅ 최종 권한 확인 완료")
        print(f"  - Free: {updated_user.get('program_permissions_free', False)}")
        print(f"  - Month1: {updated_user.get('program_permissions_month1', False)}")
        print(f"  - Month3: {updated_user.get('program_permissions_month3', False)}")
    else:
        print("❌ 최종 권한 확인 실패")

if __name__ == "__main__":
    main() 