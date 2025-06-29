from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import json
import uvicorn
from dotenv import load_dotenv
import time

# 로깅 시스템 임포트
from logger_config import logger
from middleware import LoggingMiddleware, PerformanceMiddleware

# 환경변수 로드
load_dotenv()
logger.log_business_event("service_startup", message="큐네임 서비스 시작")

# 큐네임 프로세서 임포트
from processor import QNameProcessor

app = FastAPI(
    title="QName Service", 
    description="QName 서비스 API (상품명 생성)",
    version="1.0.0"
)

# 미들웨어 등록
app.add_middleware(LoggingMiddleware)
app.add_middleware(PerformanceMiddleware)

# CORS 미들웨어 설정
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.log_business_event("cors_configured", origins=cors_origins)

# 큐네임 프로세서 초기화
try:
    qname_processor = QNameProcessor()
    logger.log_business_event("processor_initialized", message="큐네임 프로세서 초기화 완료")
except Exception as e:
    logger.log_error(e, context="processor_initialization")
    raise

@app.get("/", tags=["루트"])
async def root():
    logger.log_business_event("root_endpoint_called")
    return {"message": "QName 서비스에 오신 것을 환영합니다.", "port": 8002}

@app.get("/health", tags=["상태"])
async def health_check():
    logger.log_business_event("health_check_called")
    return {"status": "ok", "message": "QName 서비스가 정상 작동 중입니다.", "port": 8002}

@app.post("/api/qname/generate", tags=["큐네임"])
async def generate_qname(
    request: Request,
    category: str = Form(...),
    keywords: str = Form(...),
    style: str = Form("modern"),
    count: int = Form(5)
):
    """큐네임 상품명을 생성합니다."""
    start_time = time.time()
    
    try:
        # 비즈니스 이벤트 로깅
        logger.log_business_event(
            "qname_generation_started",
            user_id=request.headers.get("X-User-ID"),
            category=category,
            keywords=keywords,
            style=style,
            count=count
        )
        
        # 상품명 생성
        result = qname_processor.generate_names(
            category=category,
            keywords=keywords,
            style=style,
            count=count
        )
        
        # 성능 로깅
        duration = time.time() - start_time
        logger.log_performance(
            operation="qname_generation",
            duration=duration,
            category=category,
            count=count
        )
        
        # 성공 이벤트 로깅
        logger.log_business_event(
            "qname_generation_completed",
            user_id=request.headers.get("X-User-ID"),
            category=category,
            generated_count=len(result)
        )
        
        return {
            "status": "success",
            "data": result,
            "message": f"{len(result)}개의 상품명이 생성되었습니다."
        }
        
    except Exception as e:
        # 에러 로깅
        logger.log_error(
            e,
            context={
                "operation": "qname_generation",
                "category": category,
                "keywords": keywords,
                "style": style,
                "count": count
            },
            user_id=request.headers.get("X-User-ID")
        )
        
        raise HTTPException(
            status_code=500, 
            detail=f"큐네임 생성 중 오류가 발생했습니다: {str(e)}"
        )

@app.post("/api/qname/extract-tags", tags=["큐네임"])
async def extract_tags(
    request: Request,
    product_name: str = Form(...),
    platform: str = Form("naver")
):
    """상품명에서 태그를 추출합니다."""
    start_time = time.time()
    
    try:
        # 비즈니스 이벤트 로깅
        logger.log_business_event(
            "tag_extraction_started",
            user_id=request.headers.get("X-User-ID"),
            platform=platform
        )
        
        # 태그 추출
        result = qname_processor.extract_tags(
            product_name=product_name,
            platform=platform
        )
        
        # 성능 로깅
        duration = time.time() - start_time
        logger.log_performance(
            operation="tag_extraction",
            duration=duration,
            platform=platform
        )
        
        # 성공 이벤트 로깅
        logger.log_business_event(
            "tag_extraction_completed",
            user_id=request.headers.get("X-User-ID"),
            platform=platform,
            extracted_tags_count=len(result.get('tags', []))
        )
        
        return {
            "status": "success",
            "data": result,
            "message": "태그 추출이 완료되었습니다."
        }
        
    except Exception as e:
        # 에러 로깅
        logger.log_error(
            e,
            context={
                "operation": "tag_extraction",
                "product_name": product_name,
                "platform": platform
            },
            user_id=request.headers.get("X-User-ID")
        )
        
        raise HTTPException(
            status_code=500, 
            detail=f"태그 추출 중 오류가 발생했습니다: {str(e)}"
        )

@app.get("/api/qname/categories", tags=["큐네임"])
async def get_categories(request: Request):
    """사용 가능한 카테고리 목록을 반환합니다."""
    try:
        categories = qname_processor.get_available_categories()
        
        logger.log_business_event(
            "categories_retrieved",
            user_id=request.headers.get("X-User-ID"),
            categories_count=len(categories)
        )
        
        return {
            "status": "success",
            "data": categories,
            "message": f"{len(categories)}개의 카테고리가 있습니다."
        }
    except Exception as e:
        logger.log_error(e, context="categories_retrieval", user_id=request.headers.get("X-User-ID"))
        raise HTTPException(status_code=500, detail=f"카테고리 조회 중 오류가 발생했습니다: {str(e)}")

@app.get("/api/qname/styles", tags=["큐네임"])
async def get_styles(request: Request):
    """사용 가능한 스타일 목록을 반환합니다."""
    try:
        styles = ["modern", "classic", "trendy", "professional", "casual"]
        
        logger.log_business_event(
            "styles_retrieved",
            user_id=request.headers.get("X-User-ID"),
            styles_count=len(styles)
        )
        
        return {
            "status": "success",
            "data": styles,
            "message": f"{len(styles)}개의 스타일이 있습니다."
        }
    except Exception as e:
        logger.log_error(e, context="styles_retrieval", user_id=request.headers.get("X-User-ID"))
        raise HTTPException(status_code=500, detail=f"스타일 조회 중 오류가 발생했습니다: {str(e)}")

# 서버 실행
if __name__ == "__main__":
    logger.log_business_event("server_starting", port=8002)
    uvicorn.run("main_with_logging:app", host="0.0.0.0", port=8002, reload=True) 