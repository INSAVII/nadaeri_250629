#!/usr/bin/env python3
"""로그인 API를 직접 테스트하는 스크립트"""

import requests
import json

def test_login_api():
    url = "http://localhost:8001/api/auth/login"
    
    print('=== 로그인 API 테스트 ===')
    print(f'URL: {url}')
    
    # admin/admin으로 로그인 테스트
    data = {
        'username': 'admin',
        'password': 'admin'
    }
    
    try:
        response = requests.post(url, data=data, headers={
            'Content-Type': 'application/x-www-form-urlencoded'
        })
        
        print(f'응답 상태: {response.status_code}')
        print(f'응답 헤더: {dict(response.headers)}')
        
        if response.status_code == 200:
            result = response.json()
            print('\n=== 로그인 성공 응답 ===')
            print(f'전체 응답: {json.dumps(result, indent=2, ensure_ascii=False)}')
            
            if 'user' in result:
                user = result['user']
                print(f'\n=== 사용자 정보 상세 ===')
                print(f'ID: {user.get("id")}')
                print(f'userId: {user.get("userId")}')
                print(f'name: {user.get("name")}')
                print(f'email: {user.get("email")}')
                print(f'role: "{user.get("role")}"')
                print(f'role type: {type(user.get("role"))}')
                print(f'role == "admin": {user.get("role") == "admin"}')
                print(f'balance: {user.get("balance")}')
                print(f'is_active: {user.get("is_active")}')
                print(f'token exists: {bool(result.get("access_token"))}')
        else:
            print(f'\n=== 로그인 실패 ===')
            try:
                error = response.json()
                print(f'에러 응답: {json.dumps(error, indent=2, ensure_ascii=False)}')
            except:
                print(f'에러 텍스트: {response.text}')
                
    except requests.exceptions.ConnectionError:
        print('ERROR: 백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.')
    except Exception as e:
        print(f'ERROR: {e}')

if __name__ == "__main__":
    test_login_api()
