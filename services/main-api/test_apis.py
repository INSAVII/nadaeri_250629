#!/usr/bin/env python3
"""
백엔드 API 테스트 스크립트
"""

import requests
import json

def test_backend_apis():
    # 1. 로그인 API 테스트
    print('=== 로그인 API 테스트 ===')
    try:
        response = requests.post('http://localhost:8001/api/auth/login', 
                               data={'username': 'admin', 'password': 'admin'})
        print(f'상태 코드: {response.status_code}')
        
        if response.status_code == 200:
            data = response.json()
            print(f'응답 데이터: {json.dumps(data, indent=2, ensure_ascii=False)}')
            print(f'사용자 role: {data.get("user", {}).get("role")}')
            
            # 2. 토큰으로 예치금 업데이트 API 테스트
            token = data.get('access_token')
            if token:
                print('\n=== 예치금 업데이트 API 테스트 ===')
                headers = {'Authorization': f'Bearer {token}'}
                patch_data = {
                    'amount': 1000,
                    'description': '테스트 예치금 추가'
                }
                user_id = data.get('user', {}).get('id')
                if user_id:
                    patch_response = requests.patch(
                        f'http://localhost:8001/api/deposits/users/{user_id}/balance',
                        json=patch_data,
                        headers=headers
                    )
                    print(f'예치금 업데이트 상태 코드: {patch_response.status_code}')
                    print(f'예치금 업데이트 응답: {patch_response.text}')
                    
                    # 3. 사용자 정보 다시 확인
                    print('\n=== 업데이트 후 사용자 정보 확인 ===')
                    me_response = requests.get(
                        'http://localhost:8001/api/auth/me',
                        headers=headers
                    )
                    print(f'/api/auth/me 상태 코드: {me_response.status_code}')
                    if me_response.status_code == 200:
                        me_data = me_response.json()
                        print(f'업데이트 후 사용자 정보: {json.dumps(me_data, indent=2, ensure_ascii=False)}')
        else:
            print(f'로그인 실패: {response.text}')
    except Exception as e:
        print(f'API 테스트 오류: {e}')

if __name__ == "__main__":
    test_backend_apis()
