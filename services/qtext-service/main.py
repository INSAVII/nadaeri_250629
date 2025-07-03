from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from typing import List
import os
import json
import uvicorn
from dotenv import load_dotenv
import logging
from imageprocessor import process_images_batch, check_google_credentials

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 환경변수 로드
load_dotenv()
logger.info("큐문자 서비스 환경변수 로드 완료")

app = FastAPI(
    title="QText Service", 
    description="QText 서비스 API (텍스트 생성)",
    version="1.0.0"
)

# CORS 미들웨어 설정
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3003,http://localhost:3001,https://qclick-app.vercel.app").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info(f"큐문자 서비스 CORS 설정 완료: {cors_origins}")

@app.get("/", tags=["루트"])
async def root():
    return {"message": "QText 서비스에 오신 것을 환영합니다.", "port": "production"}

@app.get("/health", tags=["상태"])
async def health_check():
    return {"status": "ok", "message": "QText 서비스가 정상 작동 중입니다.", "port": "production"}

@app.post("/api/qtext/generate", tags=["큐문자"])
async def generate_qtext(
    content_type: str = Form(...),
    topic: str = Form(...),
    tone: str = Form("professional"),
    length: str = Form("medium"),
    keywords: str = Form("")
):
    """큐문자 텍스트를 생성합니다."""
    try:
        logger.info(f"큐문자 생성 요청: content_type={content_type}, topic={topic}, tone={tone}, length={length}")
        
        # 임시 구현 (실제로는 AI 모델 연동 필요)
        result = {
            "generated_text": f"[{content_type}] {topic}에 대한 {tone} 톤의 {length} 길이 텍스트가 생성되었습니다.",
            "word_count": 150,
            "estimated_time": "2분"
        }
        
        return {
            "status": "success",
            "data": result,
            "message": "텍스트가 성공적으로 생성되었습니다."
        }
    except Exception as e:
        logger.error(f"큐문자 생성 중 오류 발생: {str(e)}")
        raise HTTPException(status_code=500, detail=f"큐문자 생성 중 오류가 발생했습니다: {str(e)}")

@app.post("/api/qtext/rewrite", tags=["큐문자"])
async def rewrite_qtext(
    original_text: str = Form(...),
    style: str = Form("professional"),
    target_audience: str = Form("general")
):
    """기존 텍스트를 재작성합니다."""
    try:
        logger.info(f"텍스트 재작성 요청: style={style}, target_audience={target_audience}")
        
        # 임시 구현
        result = {
            "rewritten_text": f"[{style} 스타일로 {target_audience} 대상에 맞게 재작성된 텍스트]",
            "changes_made": ["톤 변경", "어휘 수정", "구조 개선"],
            "original_length": len(original_text),
            "new_length": 200
        }
        
        return {
            "status": "success",
            "data": result,
            "message": "텍스트가 성공적으로 재작성되었습니다."
        }
    except Exception as e:
        logger.error(f"텍스트 재작성 중 오류 발생: {str(e)}")
        raise HTTPException(status_code=500, detail=f"텍스트 재작성 중 오류가 발생했습니다: {str(e)}")

@app.get("/api/qtext/content-types", tags=["큐문자"])
async def get_content_types():
    """사용 가능한 콘텐츠 타입 목록을 반환합니다."""
    try:
        content_types = [
            "블로그 포스트",
            "제품 설명",
            "마케팅 카피",
            "소셜미디어 포스트",
            "이메일 템플릿",
            "광고 문구",
            "뉴스 기사",
            "기술 문서"
        ]
        return {
            "status": "success",
            "data": content_types,
            "message": f"{len(content_types)}개의 콘텐츠 타입이 있습니다."
        }
    except Exception as e:
        logger.error(f"콘텐츠 타입 조회 중 오류 발생: {str(e)}")
        raise HTTPException(status_code=500, detail=f"콘텐츠 타입 조회 중 오류가 발생했습니다: {str(e)}")

@app.get("/api/qtext/tones", tags=["큐문자"])
async def get_tones():
    """사용 가능한 톤 목록을 반환합니다."""
    try:
        tones = ["professional", "casual", "friendly", "formal", "creative", "technical", "persuasive"]
        return {
            "status": "success",
            "data": tones,
            "message": f"{len(tones)}개의 톤이 있습니다."
        }
    except Exception as e:
        logger.error(f"톤 조회 중 오류 발생: {str(e)}")
        raise HTTPException(status_code=500, detail=f"톤 조회 중 오류가 발생했습니다: {str(e)}")

@app.get("/api/qtext/lengths", tags=["큐문자"])
async def get_lengths():
    """사용 가능한 길이 옵션을 반환합니다."""
    try:
        lengths = ["short", "medium", "long"]
        return {
            "status": "success",
            "data": lengths,
            "message": f"{len(lengths)}개의 길이 옵션이 있습니다."
        }
    except Exception as e:
        logger.error(f"길이 옵션 조회 중 오류 발생: {str(e)}")
        raise HTTPException(status_code=500, detail=f"길이 옵션 조회 중 오류가 발생했습니다: {str(e)}")

@app.post("/api/qtext/process-images", tags=["이미지 문자 제거"])
async def process_images(
    files: List[UploadFile] = File(...),
    user_name: str = Form(default="사용자"),
    user_id: str = Form(default="unknown")
):
    """이미지에서 문자를 제거하고 ZIP 파일로 반환합니다."""
    try:
        logger.info(f"이미지 처리 요청: {len(files)}개 파일")
        
        # Google Cloud 인증 확인
        if not check_google_credentials():
            raise HTTPException(status_code=500, detail="Google Cloud 인증이 설정되지 않았습니다.")
        
        # 파일 개수 제한 (최대 100개)
        if len(files) > 100:
            raise HTTPException(status_code=400, detail=f"파일 개수가 최대 허용량(100개)을 초과했습니다: {len(files)}개")
        
        # 파일 크기 제한 (개당 최대 10MB)
        max_file_size = 10 * 1024 * 1024  # 10MB
        image_files = []
        
        for file in files:
            # 파일 크기 확인
            if file.size and file.size > max_file_size:
                raise HTTPException(status_code=400, detail=f"파일 크기가 너무 큽니다: {file.filename} ({file.size/1024/1024:.1f}MB)")
            
            # 이미지 파일 읽기
            content = await file.read()
            if len(content) > max_file_size:
                raise HTTPException(status_code=400, detail=f"파일 크기가 너무 큽니다: {file.filename}")
            
            # 안전한 파일명으로 변환하여 추가
            safe_name = file.filename or f"image_{len(image_files)+1}.jpg"
            image_files.append((content, safe_name))
            logger.info(f"파일 추가됨: {safe_name} ({len(content)/1024:.1f}KB)")
        
        # 사용자 정보 준비
        user_info = {
            "name": user_name,
            "id": user_id
        }
        
        # 이미지 배치 처리
        logger.info(f"이미지 배치 처리 시작: {len(image_files)}개 파일 (사용자: {user_name})")
        zip_data = await process_images_batch(image_files, user_info)
        
        # ZIP 파일로 응답
        return Response(
            content=zip_data,
            media_type="application/zip",
            headers={
                "Content-Disposition": "attachment; filename=processed_images.zip"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"이미지 처리 중 오류 발생: {str(e)}")
        raise HTTPException(status_code=500, detail=f"이미지 처리 중 오류가 발생했습니다: {str(e)}")

# 서버 실행 (Railway 배포용)
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8003))
    uvicorn.run("main:app", host="0.0.0.0", port=port) 