from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import time
import json
import logging
from typing import Dict, List
import uvicorn
from datetime import datetime, timedelta
from collections import defaultdict

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimpleAPIGateway:
    """간단한 API Gateway"""
    
    def __init__(self):
        self.app = FastAPI(
            title="QClick API Gateway",
            description="QClick 마이크로서비스 API Gateway",
            version="1.0.0"
        )
        
        # 서비스 매핑
        self.services = {
            "main-api": "http://localhost:8001",
            "qname-service": "http://localhost:8002", 
            "qtext-service": "http://localhost:8003"
        }
        
        # Rate Limiting 설정 (귀하의 규모에 맞게)
        self.rate_limits = {
            "default": {"requests": 1000, "window": 60},  # 분당 1000개
            "qname": {"requests": 2000, "window": 60},    # 큐네임은 더 높게
            "qtext": {"requests": 500, "window": 60}      # 큐문자는 낮게
        }
        
        # 요청 카운터 (실제로는 Redis 사용 권장)
        self.request_counters = defaultdict(lambda: defaultdict(int))
        self.last_reset = datetime.now()
        
        self.setup_middleware()
        self.setup_routes()
    
    def setup_middleware(self):
        """미들웨어 설정"""
        # CORS
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["http://localhost:3003", "http://localhost:3001"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    
    def setup_routes(self):
        """라우트 설정"""
        
        @self.app.get("/")
        async def root():
            return {
                "message": "QClick API Gateway",
                "services": list(self.services.keys()),
                "timestamp": datetime.now().isoformat()
            }
        
        @self.app.get("/health")
        async def health_check():
            """전체 서비스 헬스 체크"""
            health_status = {}
            
            for service_name, service_url in self.services.items():
                try:
                    async with httpx.AsyncClient(timeout=5.0) as client:
                        response = await client.get(f"{service_url}/health")
                        health_status[service_name] = {
                            "status": "healthy" if response.status_code == 200 else "unhealthy",
                            "response_time": response.elapsed.total_seconds() * 1000
                        }
                except Exception as e:
                    health_status[service_name] = {
                        "status": "error",
                        "error": str(e)
                    }
            
            return {
                "gateway": "healthy",
                "services": health_status,
                "timestamp": datetime.now().isoformat()
            }
        
        @self.app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
        async def proxy_request(request: Request, path: str):
            """모든 요청을 적절한 서비스로 프록시"""
            return await self.handle_request(request, path)
    
    async def handle_request(self, request: Request, path: str):
        """요청 처리 및 프록시"""
        start_time = time.time()
        
        # 서비스 결정
        target_service = self.determine_service(path)
        if not target_service:
            raise HTTPException(status_code=404, detail="Service not found")
        
        # Rate Limiting 체크
        if not self.check_rate_limit(request, target_service):
            raise HTTPException(
                status_code=429, 
                detail="Rate limit exceeded. Please try again later."
            )
        
        # 요청 로깅
        logger.info(f"Proxying request: {request.method} {path} -> {target_service}")
        
        try:
            # 요청 프록시
            response = await self.proxy_request(request, target_service, path)
            
            # 응답 시간 계산
            response_time = (time.time() - start_time) * 1000
            
            # 성공 로깅
            logger.info(f"Request completed: {request.method} {path} -> {response.status_code} ({response_time:.2f}ms)")
            
            return response
            
        except Exception as e:
            # 에러 로깅
            logger.error(f"Request failed: {request.method} {path} -> {str(e)}")
            raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
    def determine_service(self, path: str) -> str:
        """경로에 따라 서비스 결정"""
        if path.startswith(("api/auth", "api/payments", "api/deposits", "api/manuals", "api/pricing", "api/promotion", "api/debug")):
            return "main-api"
        elif path.startswith("api/qname"):
            return "qname-service"
        elif path.startswith("api/qtext"):
            return "qtext-service"
        else:
            return None
    
    def check_rate_limit(self, request: Request, service: str) -> bool:
        """Rate Limiting 체크"""
        # 시간 윈도우 리셋
        now = datetime.now()
        if (now - self.last_reset).seconds >= 60:
            self.request_counters.clear()
            self.last_reset = now
        
        # 서비스별 Rate Limit 가져오기
        if service == "qname-service":
            limit_config = self.rate_limits["qname"]
        elif service == "qtext-service":
            limit_config = self.rate_limits["qtext"]
        else:
            limit_config = self.rate_limits["default"]
        
        # 현재 요청 수 체크
        current_count = self.request_counters[service][now.minute]
        
        if current_count >= limit_config["requests"]:
            logger.warning(f"Rate limit exceeded for {service}: {current_count}/{limit_config['requests']}")
            return False
        
        # 카운터 증가
        self.request_counters[service][now.minute] += 1
        return True
    
    async def proxy_request(self, request: Request, service: str, path: str):
        """실제 요청 프록시"""
        service_url = self.services[service]
        target_url = f"{service_url}/{path}"
        
        # 요청 헤더 준비
        headers = dict(request.headers)
        headers.pop("host", None)  # host 헤더 제거
        
        # 요청 바디 준비
        body = None
        if request.method in ["POST", "PUT", "PATCH"]:
            body = await request.body()
        
        # 프록시 요청
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body,
                params=request.query_params
            )
            
            # 응답 생성
            content = response.content
            if response.headers.get("content-type", "").startswith("application/json"):
                content = response.json()
            
            return JSONResponse(
                content=content,
                status_code=response.status_code,
                headers=dict(response.headers)
            )

# Gateway 인스턴스 생성
gateway = SimpleAPIGateway()

if __name__ == "__main__":
    print("🚀 QClick API Gateway 시작 중...")
    print("📋 설정된 서비스:")
    for name, url in gateway.services.items():
        print(f"  - {name}: {url}")
    print(f"\n🔗 Gateway URL: http://localhost:8000")
    print(f"📊 Rate Limits:")
    for service, limits in gateway.rate_limits.items():
        print(f"  - {service}: {limits['requests']} requests/{limits['window']}s")
    
    uvicorn.run(gateway.app, host="0.0.0.0", port=8000) 