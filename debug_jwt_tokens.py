#!/usr/bin/env python3
"""
JWT 토큰 디버깅 스크립트
토큰 형식과 내용을 분석하여 문제를 진단합니다.
"""

import jwt
import json
import base64
from datetime import datetime
import os
from dotenv import load_dotenv

# 환경변수 로드
load_dotenv()

def decode_jwt_parts(token):
    """JWT 토큰의 각 부분을 디코드하여 분석"""
    try:
        # 토큰을 세그먼트로 분리
        parts = token.split('.')
        
        if len(parts) != 3:
            print(f"❌ 잘못된 JWT 형식: {len(parts)}개 세그먼트 (3개 필요)")
            return None
            
        header_b64, payload_b64, signature = parts
        
        # Header 디코드
        try:
            header_json = base64.urlsafe_b64decode(header_b64 + '==').decode('utf-8')
            header = json.loads(header_json)
            print(f"✅ Header: {json.dumps(header, indent=2)}")
        except Exception as e:
            print(f"❌ Header 디코드 실패: {e}")
            header = None
            
        # Payload 디코드
        try:
            payload_json = base64.urlsafe_b64decode(payload_b64 + '==').decode('utf-8')
            payload = json.loads(payload_json)
            
            # 만료 시간 변환
            if 'exp' in payload:
                exp_timestamp = payload['exp']
                exp_datetime = datetime.fromtimestamp(exp_timestamp)
                payload['exp_readable'] = exp_datetime.strftime('%Y-%m-%d %H:%M:%S')
                payload['exp_timestamp'] = exp_timestamp
                
            if 'iat' in payload:
                iat_timestamp = payload['iat']
                iat_datetime = datetime.fromtimestamp(iat_timestamp)
                payload['iat_readable'] = iat_datetime.strftime('%Y-%m-%d %H:%M:%S')
                payload['iat_timestamp'] = iat_timestamp
                
            print(f"✅ Payload: {json.dumps(payload, indent=2)}")
        except Exception as e:
            print(f"❌ Payload 디코드 실패: {e}")
            payload = None
            
        # Signature 확인
        print(f"✅ Signature: {signature[:20]}... (길이: {len(signature)})")
        
        return {
            'header': header,
            'payload': payload,
            'signature': signature
        }
        
    except Exception as e:
        print(f"❌ 토큰 분석 실패: {e}")
        return None

def verify_token_with_secret(token, secret_key):
    """시크릿 키로 토큰 검증"""
    try:
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        print(f"✅ 토큰 검증 성공!")
        return payload
    except jwt.ExpiredSignatureError:
        print("❌ 토큰이 만료되었습니다")
        return None
    except jwt.InvalidTokenError as e:
        print(f"❌ 토큰 검증 실패: {e}")
        return None

def main():
    print("🔍 JWT 토큰 디버깅 도구")
    print("=" * 50)
    
    # 환경변수에서 시크릿 키 가져오기
    secret_key = os.getenv("JWT_SECRET", "qclick_secret_key_change_in_production")
    print(f"🔑 사용 중인 SECRET_KEY: {secret_key[:20]}... (길이: {len(secret_key)})")
    
    # 테스트 토큰들
    test_tokens = [
        # 여기에 문제가 되는 토큰들을 넣으세요
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkBxY2xpY2suY29tIiwiZXhwIjoxNzM1NjgwMDAwfQ.example_signature",
        # 실제 토큰 예시 (테스트용)
    ]
    
    for i, token in enumerate(test_tokens, 1):
        print(f"\n🔍 토큰 {i} 분석:")
        print("-" * 30)
        
        # 토큰 길이와 형식 확인
        print(f"토큰 길이: {len(token)}")
        print(f"토큰 시작: {token[:50]}...")
        
        # 세그먼트 분석
        parts = token.split('.')
        print(f"세그먼트 수: {len(parts)}")
        
        if len(parts) == 3:
            print(f"Header 길이: {len(parts[0])}")
            print(f"Payload 길이: {len(parts[1])}")
            print(f"Signature 길이: {len(parts[2])}")
        
        # 상세 분석
        decoded = decode_jwt_parts(token)
        
        if decoded and decoded['payload']:
            # 시크릿 키로 검증
            verified = verify_token_with_secret(token, secret_key)
            if verified:
                print("✅ 토큰이 유효합니다!")
            else:
                print("❌ 토큰이 유효하지 않습니다!")
        
        print()

if __name__ == "__main__":
    main() 