import requests
import json

def test_admin_login():
    """admin 로그인 테스트"""
    url = "http://localhost:8001/api/auth/login"
    
    # admin 로그인 데이터
    data = {
        "username": "admin",
        "password": "admin"
    }
    
    try:
        print("🔍 Admin 로그인 테스트 시작...")
        print(f"URL: {url}")
        print(f"데이터: {data}")
        
        response = requests.post(url, data=data)
        
        print(f"응답 상태: {response.status_code}")
        print(f"응답 헤더: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ 로그인 성공!")
            print("📋 응답 데이터:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            
            # 사용자 정보 상세 분석
            user = result.get('user', {})
            print("\n🔍 사용자 정보 분석:")
            print(f"  - ID: {user.get('id')}")
            print(f"  - userId: {user.get('userId')}")
            print(f"  - name: {user.get('name')}")
            print(f"  - email: {user.get('email')}")
            print(f"  - role: {user.get('role')} (타입: {type(user.get('role'))})")
            print(f"  - is_active: {user.get('is_active')}")
            print(f"  - balance: {user.get('balance')}")
            
            # role 검증
            role = user.get('role')
            if role == 'admin':
                print("✅ Role이 'admin'으로 올바르게 설정됨")
            else:
                print(f"❌ Role이 예상과 다름: '{role}' (예상: 'admin')")
                
        else:
            print("❌ 로그인 실패!")
            print(f"응답 내용: {response.text}")
            
    except Exception as e:
        print(f"❌ 테스트 중 오류 발생: {e}")

if __name__ == "__main__":
    test_admin_login() 