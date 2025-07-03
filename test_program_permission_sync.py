#!/usr/bin/env python3
"""
프로그램 권한 동기화 테스트 스크립트 (배포 환경 최적화)
배포 환경에서의 권한 관리 안정성을 검증합니다.
"""

import requests
import json
import time
import sys
import os
from datetime import datetime

# 환경별 API URL 설정
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8001")

# 테스트 설정
TEST_CONFIG = {
    "timeout": 30,  # 요청 타임아웃
    "retry_count": 3,  # 재시도 횟수
    "retry_delay": 2,  # 재시도 간격(초)
}

def make_request_with_retry(method, url, **kwargs):
    """재시도 로직이 포함된 HTTP 요청"""
    for attempt in range(TEST_CONFIG["retry_count"]):
        try:
            kwargs.setdefault("timeout", TEST_CONFIG["timeout"])
            response = getattr(requests, method.lower())(url, **kwargs)
            return response
        except requests.RequestException as e:
            if attempt == TEST_CONFIG["retry_count"] - 1:
                raise e
            print(f"⚠️ 요청 실패 (재시도 {attempt + 1}/{TEST_CONFIG['retry_count']}): {e}")
            time.sleep(TEST_CONFIG["retry_delay"])
    return None

def log_test_result(test_name, success, details=None):
    """테스트 결과 로깅"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status = "✅ 성공" if success else "❌ 실패"
    print(f"[{timestamp}] {test_name}: {status}")
    if details:
        print(f"    📋 세부사항: {details}")

def test_program_permission_sync():
    """프로그램 권한 동기화 테스트 (개선된 버전)"""
    print("=" * 60)
    print("프로그램 권한 동기화 테스트 (배포 환경 최적화)")
    print(f"API URL: {API_BASE_URL}")
    print("=" * 60)
    
    # 1. admin 로그인
    print("\n1️⃣ Admin 로그인 테스트...")
    login_response = make_request_with_retry("post", f"{API_BASE_URL}/api/auth/login", data={
        "username": "admin",
        "password": "admin"
    })
    
    if login_response is None or login_response.status_code != 200:
        print(f"❌ 로그인 실패: {login_response.status_code if login_response else '응답 없음'}")
        return False
    
    login_data = login_response.json()
    token = login_data.get("access_token")
    
    if not token:
        print("❌ 토큰 없음")
        return False
    
    print("✅ Admin 로그인 성공")
    
    # 2. 현재 사용자 정보 조회 (프로그램 권한 포함)
    print("\n2️⃣ 사용자 정보 조회 (프로그램 권한 포함)...")
    me_response = make_request_with_retry("get", f"{API_BASE_URL}/api/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })
    
    if me_response is None or me_response.status_code != 200:
        print(f"❌ 사용자 정보 조회 실패: {me_response.status_code if me_response else '응답 없음'}")
        return False
    
    user_data = me_response.json()
    print("✅ 사용자 정보 조회 성공")
    print(f"   - User ID: {user_data.get('userId', 'N/A')}")
    print(f"   - Role: {user_data.get('role', 'N/A')}")
    print(f"   - Program Permissions: {user_data.get('programPermissions', 'N/A')}")
    
    # 3. 프로그램 권한 변경 테스트
    print("\n3️⃣ 프로그램 권한 변경 테스트...")
    
    # free 권한 false로 변경
    permission_response = make_request_with_retry(
        "post",
        f"{API_BASE_URL}/api/deposits/update-program-permission?user_id=admin",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        json={
            "program_id": "free",
            "is_allowed": False
        }
    )
    
    if permission_response is None or permission_response.status_code != 200:
        print(f"❌ 권한 변경 실패: {permission_response.status_code if permission_response else '응답 없음'}")
        print(f"   응답: {permission_response.text if permission_response else '세부정보 없음'}")
        return False
    
    print("✅ free 권한 false로 변경 성공")
    
    # 4. 변경 후 사용자 정보 재조회
    print("\n4️⃣ 권한 변경 후 사용자 정보 재조회...")
    me_response_after = make_request_with_retry("get", f"{API_BASE_URL}/api/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })
    
    if me_response_after is None or me_response_after.status_code != 200:
        print(f"❌ 재조회 실패: {me_response_after.status_code if me_response_after else '응답 없음'}")
        return False
    
    user_data_after = me_response_after.json()
    print("✅ 사용자 정보 재조회 성공")
    print(f"   - Program Permissions (변경 후): {user_data_after.get('programPermissions', 'N/A')}")
    
    # 5. 변경 사항 검증
    permissions_before = user_data.get('programPermissions', {})
    permissions_after = user_data_after.get('programPermissions', {})
    
    if permissions_before.get('free') == permissions_after.get('free'):
        print("❌ 권한 변경이 반영되지 않음")
        return False
    
    print("✅ 권한 변경이 정상적으로 반영됨")
    
    # 6. 권한 복원 (원상태로)
    print("\n5️⃣ 권한 복원...")
    restore_response = make_request_with_retry(
        "post",
        f"{API_BASE_URL}/api/deposits/update-program-permission?user_id=admin",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        json={
            "program_id": "free",
            "is_allowed": True
        }
    )
    
    if restore_response is None or restore_response.status_code != 200:
        print(f"⚠️ 권한 복원 실패: {restore_response.status_code if restore_response else '응답 없음'}")
    else:
        print("✅ 권한 복원 성공")
    
    print("\n🎉 프로그램 권한 동기화 테스트 완료!")
    return True

def main():
    """메인 함수"""
    try:
        # 서버 상태 확인
        health_response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        if health_response.status_code != 200:
            print("❌ 백엔드 서버가 실행되지 않았습니다.")
            return
    except requests.exceptions.RequestException:
        print("❌ 백엔드 서버에 연결할 수 없습니다.")
        return
    
    # 테스트 실행
    success = test_program_permission_sync()
    
    if success:
        print("\n✅ 모든 테스트 통과! 배포 환경에서 안정적으로 동작합니다.")
    else:
        print("\n❌ 테스트 실패! 배포 전 문제를 해결해야 합니다.")
        sys.exit(1)

if __name__ == "__main__":
    main()
