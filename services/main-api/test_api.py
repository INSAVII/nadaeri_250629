#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json

def test_api():
    base_url = "http://localhost:8001"
    
    # 1. 로그인 테스트
    print("=== 로그인 테스트 ===")
    login_data = {
        "username": "admin@qclick.com",
        "password": "admin123"
    }
    
    try:
        login_response = requests.post(f"{base_url}/api/auth/login", data=login_data)
        print(f"로그인 응답 상태: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result.get('access_token')
            print(f"토큰 획득: {token[:20]}...")
            
            # 2. 사용자 목록 API 테스트
            print("\n=== 사용자 목록 API 테스트 ===")
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            users_response = requests.get(f"{base_url}/api/auth/users", headers=headers)
            print(f"사용자 목록 응답 상태: {users_response.status_code}")
            
            if users_response.status_code == 200:
                users_result = users_response.json()
                print(f"총 사용자 수: {users_result.get('total', 0)}")
                print(f"사용자 목록: {json.dumps(users_result, indent=2, ensure_ascii=False)}")
            else:
                print(f"오류 응답: {users_response.text}")
                
        else:
            print(f"로그인 실패: {login_response.text}")
            
    except Exception as e:
        print(f"API 테스트 중 오류: {e}")

if __name__ == "__main__":
    test_api() 