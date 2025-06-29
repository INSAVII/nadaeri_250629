import requests
import json
import time
import os

class KongGatewaySetup:
    """Kong API Gateway 설정 클래스"""
    
    def __init__(self, admin_url="http://localhost:8001"):
        self.admin_url = admin_url
        self.services = {
            "main-api": {
                "name": "main-api",
                "url": "http://host.docker.internal:8001",
                "routes": [
                    {
                        "name": "main-api-routes",
                        "paths": ["/api/auth", "/api/payments", "/api/deposits", "/api/manuals", "/api/pricing", "/api/promotion", "/api/debug", "/api/health"]
                    }
                ]
            },
            "qname-service": {
                "name": "qname-service", 
                "url": "http://host.docker.internal:8002",
                "routes": [
                    {
                        "name": "qname-routes",
                        "paths": ["/api/qname"]
                    }
                ]
            },
            "qtext-service": {
                "name": "qtext-service",
                "url": "http://host.docker.internal:8003", 
                "routes": [
                    {
                        "name": "qtext-routes",
                        "paths": ["/api/qtext"]
                    }
                ]
            }
        }
    
    def wait_for_kong(self):
        """Kong이 준비될 때까지 대기"""
        print("🔄 Kong API Gateway 시작 대기 중...")
        max_attempts = 30
        for attempt in range(max_attempts):
            try:
                response = requests.get(f"{self.admin_url}/status")
                if response.status_code == 200:
                    print("✅ Kong API Gateway 준비 완료!")
                    return True
            except requests.exceptions.RequestException:
                pass
            
            print(f"⏳ 대기 중... (시도 {attempt + 1}/{max_attempts})")
            time.sleep(2)
        
        print("❌ Kong API Gateway 시작 실패")
        return False
    
    def create_service(self, service_config):
        """서비스 생성"""
        service_name = service_config["name"]
        service_url = service_config["url"]
        
        print(f"🔧 {service_name} 서비스 생성 중...")
        
        # 서비스 생성
        service_data = {
            "name": service_name,
            "url": service_url
        }
        
        try:
            response = requests.post(
                f"{self.admin_url}/services",
                json=service_data
            )
            
            if response.status_code in [200, 201, 409]:  # 409는 이미 존재하는 경우
                print(f"✅ {service_name} 서비스 생성 완료")
                return True
            else:
                print(f"❌ {service_name} 서비스 생성 실패: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ {service_name} 서비스 생성 중 오류: {str(e)}")
            return False
    
    def create_routes(self, service_name, routes_config):
        """라우트 생성"""
        print(f"🛣️  {service_name} 라우트 생성 중...")
        
        for route_config in routes_config:
            route_name = route_config["name"]
            paths = route_config["paths"]
            
            route_data = {
                "name": route_name,
                "paths": paths,
                "strip_path": False
            }
            
            try:
                response = requests.post(
                    f"{self.admin_url}/services/{service_name}/routes",
                    json=route_data
                )
                
                if response.status_code in [200, 201, 409]:
                    print(f"✅ {route_name} 라우트 생성 완료")
                else:
                    print(f"❌ {route_name} 라우트 생성 실패: {response.status_code}")
                    
            except Exception as e:
                print(f"❌ {route_name} 라우트 생성 중 오류: {str(e)}")
    
    def setup_rate_limiting(self, service_name):
        """Rate Limiting 설정 (귀하의 규모에 맞게)"""
        print(f"🚦 {service_name} Rate Limiting 설정 중...")
        
        # 귀하의 규모에 맞는 설정:
        # - 200명 사용자 / 월
        # - 1인당 2,000개 상품명 / 월
        # - 하루 평균: 13,333개 요청
        # - 시간당: 약 556개 요청
        
        rate_limit_data = {
            "name": "rate-limiting",
            "config": {
                "minute": 1000,    # 분당 1000개 (여유있게)
                "hour": 20000,     # 시간당 20,000개
                "day": 500000,     # 하루 500,000개
                "policy": "local"
            }
        }
        
        try:
            response = requests.post(
                f"{self.admin_url}/services/{service_name}/plugins",
                json=rate_limit_data
            )
            
            if response.status_code in [200, 201, 409]:
                print(f"✅ {service_name} Rate Limiting 설정 완료")
            else:
                print(f"❌ {service_name} Rate Limiting 설정 실패: {response.status_code}")
                
        except Exception as e:
            print(f"❌ {service_name} Rate Limiting 설정 중 오류: {str(e)}")
    
    def setup_cors(self, service_name):
        """CORS 설정"""
        print(f"🌐 {service_name} CORS 설정 중...")
        
        cors_data = {
            "name": "cors",
            "config": {
                "origins": ["http://localhost:3000", "http://localhost:3001"],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "headers": ["Content-Type", "Authorization", "X-User-ID"],
                "exposed_headers": ["X-Request-ID"],
                "credentials": True,
                "max_age": 3600
            }
        }
        
        try:
            response = requests.post(
                f"{self.admin_url}/services/{service_name}/plugins",
                json=cors_data
            )
            
            if response.status_code in [200, 201, 409]:
                print(f"✅ {service_name} CORS 설정 완료")
            else:
                print(f"❌ {service_name} CORS 설정 실패: {response.status_code}")
                
        except Exception as e:
            print(f"❌ {service_name} CORS 설정 중 오류: {str(e)}")
    
    def setup_key_auth(self, service_name):
        """API Key 인증 설정"""
        print(f"🔑 {service_name} API Key 인증 설정 중...")
        
        auth_data = {
            "name": "key-auth",
            "config": {
                "key_names": ["apikey"],
                "hide_credentials": True
            }
        }
        
        try:
            response = requests.post(
                f"{self.admin_url}/services/{service_name}/plugins",
                json=auth_data
            )
            
            if response.status_code in [200, 201, 409]:
                print(f"✅ {service_name} API Key 인증 설정 완료")
            else:
                print(f"❌ {service_name} API Key 인증 설정 실패: {response.status_code}")
                
        except Exception as e:
            print(f"❌ {service_name} API Key 인증 설정 중 오류: {str(e)}")
    
    def setup_all(self):
        """전체 설정"""
        print("🚀 Kong API Gateway 설정 시작")
        print("=" * 50)
        
        if not self.wait_for_kong():
            return False
        
        # 각 서비스 설정
        for service_name, service_config in self.services.items():
            print(f"\n📦 {service_name.upper()} 설정")
            print("-" * 30)
            
            # 서비스 생성
            if self.create_service(service_config):
                # 라우트 생성
                self.create_routes(service_name, service_config["routes"])
                
                # 플러그인 설정
                self.setup_rate_limiting(service_name)
                self.setup_cors(service_name)
                
                # 메인 API에만 인증 추가
                if service_name == "main-api":
                    self.setup_key_auth(service_name)
        
        print("\n" + "=" * 50)
        print("🎉 Kong API Gateway 설정 완료!")
        print("\n📋 설정된 엔드포인트:")
        print("  - API Gateway: http://localhost:8000")
        print("  - Kong Admin: http://localhost:8001")
        print("\n🔗 프록시된 서비스:")
        print("  - 메인 API: http://localhost:8000/api/auth/*")
        print("  - 큐네임: http://localhost:8000/api/qname/*")
        print("  - 큐문자: http://localhost:8000/api/qtext/*")
        
        return True

if __name__ == "__main__":
    setup = KongGatewaySetup()
    setup.setup_all() 