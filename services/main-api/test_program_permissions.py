#!/usr/bin/env python3
"""
프로그램 권한 시스템 테스트 스크립트
"""

import requests
import json
import time

# API 기본 URL
BASE_URL = "http://localhost:8001"

def test_program_permissions():
    """프로그램 권한 시스템을 테스트합니다."""
    
    print("=== 프로그램 권한 시스템 테스트 ===\n")
    
    # 1. 관리자 로그인
    print("1. 관리자 로그인 테스트")
    login_data = {
        "username": "admin@qclick.com",
        "password": "admin"
    }
    
    try:
        login_response = requests.post(f"{BASE_URL}/api/auth/login", data=login_data)
        if login_response.status_code == 200:
            login_result = login_response.json()
            admin_token = login_result.get("access_token")
            print(f"✅ 관리자 로그인 성공: {login_result.get('user', {}).get('email')}")
        else:
            print(f"❌ 관리자 로그인 실패: {login_response.status_code}")
            return
    except Exception as e:
        print(f"❌ 로그인 요청 실패: {e}")
        return
    
    # 2. 사용자 목록 조회
    print("\n2. 사용자 목록 조회 테스트")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        users_response = requests.get(f"{BASE_URL}/api/deposits/users", headers=headers)
        if users_response.status_code == 200:
            users = users_response.json()
            print(f"✅ 사용자 목록 조회 성공: {len(users)}명")
            for user in users[:3]:  # 처음 3명만 출력
                print(f"   - {user.get('email')} (ID: {user.get('id')})")
        else:
            print(f"❌ 사용자 목록 조회 실패: {users_response.status_code}")
    except Exception as e:
        print(f"❌ 사용자 목록 조회 실패: {e}")
    
    # 3. 프로그램 권한 업데이트 테스트
    print("\n3. 프로그램 권한 업데이트 테스트")
    test_user_id = "admin"  # admin 사용자로 테스트
    
    for program_id in ["free", "month1", "month3"]:
        try:
            permission_data = {
                "program_id": program_id,
                "is_allowed": True,
                "duration_months": None
            }
            
            permission_response = requests.post(
                f"{BASE_URL}/api/deposits/update-program-permission?user_id={test_user_id}",
                headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
                json=permission_data
            )
            
            if permission_response.status_code == 200:
                result = permission_response.json()
                print(f"✅ {program_id} 권한 업데이트 성공: {result.get('message')}")
            else:
                error_data = permission_response.json()
                print(f"❌ {program_id} 권한 업데이트 실패: {error_data.get('detail', permission_response.status_code)}")
                
        except Exception as e:
            print(f"❌ {program_id} 권한 업데이트 요청 실패: {e}")
    
    # 4. 프로그램 다운로드 테스트 (일반 사용자)
    print("\n4. 프로그램 다운로드 테스트")
    
    # 일반 사용자 로그인 (admin 계정 사용)
    try:
        download_data = {
            "program_id": "qcapture",
            "license_type": "free"
        }
        
        download_response = requests.post(
            f"{BASE_URL}/api/deposits/download-program",
            headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
            json=download_data
        )
        
        if download_response.status_code == 200:
            result = download_response.json()
            print(f"✅ 프로그램 다운로드 성공: {result.get('message')}")
            print(f"   차감된 금액: {result.get('data', {}).get('amount_deducted', 0)}원")
            print(f"   남은 잔액: {result.get('data', {}).get('remaining_balance', 0)}원")
        else:
            error_data = download_response.json()
            print(f"❌ 프로그램 다운로드 실패: {error_data.get('detail', download_response.status_code)}")
            
    except Exception as e:
        print(f"❌ 프로그램 다운로드 요청 실패: {e}")
    
    print("\n=== 테스트 완료 ===")

if __name__ == "__main__":
    test_program_permissions() 