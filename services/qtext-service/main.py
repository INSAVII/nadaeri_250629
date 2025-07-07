# -*- coding: utf-8 -*-
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from typing import List
import os
import json
import uvicorn
import requests
from dotenv import load_dotenv
import logging
from imageprocessor import process_images_batch, check_google_credentials
from datetime import datetime

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 환경변수 로드
load_dotenv()
logger.info("큐문자 서비스 환경변수 로드 완료")

# 메인 API 설정
MAIN_API_URL = os.getenv("MAIN_API_URL", "http://localhost:8001")
MAIN_API_TOKEN = os.getenv("MAIN_API_TOKEN", "")

app = FastAPI(
    title="QText Service", 
    description="QText 서비스 API (이미지 문자 제거)",
    version="1.0.0"
)

# CORS 미들웨어 설정
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3003,http://localhost:3001,https://qclick-app.vercel.app").split(",")
# 개발 환경에서는 모든 origin 허용
if os.getenv("ENVIRONMENT", "development") == "development":
    cors_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)
logger.info(f"큐문자 서비스 CORS 설정 완료: {cors_origins}")

def call_main_api(endpoint: str, method: str = "GET", data: dict = None, headers: dict = None):
    """메인 API 호출 함수"""
    try:
        url = f"{MAIN_API_URL}{endpoint}"
        default_headers = {"Content-Type": "application/json"}
        if headers:
            default_headers.update(headers)
        
        if method.upper() == "GET":
            response = requests.get(url, headers=default_headers, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=default_headers, timeout=10)
        else:
            raise ValueError(f"지원하지 않는 HTTP 메서드: {method}")
        
        response.raise_for_status()
        return response.json()
        
    except requests.exceptions.RequestException as e:
        logger.error(f"메인 API 호출 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"메인 API 연동 실패: {str(e)}")

@app.get("/", tags=["루트"])
async def root():
    return {"message": "QText 서비스에 오신 것을 환영합니다.", "port": "production"}

@app.get("/health", tags=["상태"])
async def health_check():
    return {"status": "ok", "message": "QText 서비스가 정상 작동 중입니다.", "port": "production"}

@app.post("/api/qtext/process-images", tags=["이미지 문자 제거"])
async def process_images(
    files: List[UploadFile] = File(...),
    user_id: str = Form(...),
    user_token: str = Form(...),
    job_id: str = Form(...)
):
    """이미지에서 문자를 제거하고 ZIP 파일로 반환합니다."""
    try:
        logger.info(f"이미지 처리 요청: {len(files)}개 파일, 사용자: {user_id}, 작업: {job_id}")
        
        # Google Cloud 인증 확인
        if not check_google_credentials():
            # 작업 실패 처리
            try:
                call_main_api(
                    f"/api/qtext/jobs/{job_id}/fail",
                    method="POST",
                    data={"error_message": "Google Cloud 인증이 설정되지 않았습니다."},
                    headers={"Authorization": f"Bearer {user_token}"}
                )
            except Exception as e:
                logger.error(f"작업 실패 처리 중 오류: {str(e)}")
            
            raise HTTPException(status_code=500, detail="Google Cloud 인증이 설정되지 않았습니다.")
        
        # 파일 개수 제한 (최대 100개)
        if len(files) > 100:
            error_msg = f"파일 개수가 최대 허용량(100개)을 초과했습니다: {len(files)}개"
            try:
                call_main_api(
                    f"/api/qtext/jobs/{job_id}/fail",
                    method="POST",
                    data={"error_message": error_msg},
                    headers={"Authorization": f"Bearer {user_token}"}
                )
            except Exception as e:
                logger.error(f"작업 실패 처리 중 오류: {str(e)}")
            
            raise HTTPException(status_code=400, detail=error_msg)
        
        # 파일 크기 제한 (개당 최대 10MB)
        max_file_size = 10 * 1024 * 1024  # 10MB
        image_files = []
        original_filenames = []
        
        for file in files:
            # 파일 크기 확인
            if file.size and file.size > max_file_size:
                error_msg = f"파일 크기가 너무 큽니다: {file.filename} ({file.size/1024/1024:.1f}MB)"
                try:
                    call_main_api(
                        f"/api/qtext/jobs/{job_id}/fail",
                        method="POST",
                        data={"error_message": error_msg},
                        headers={"Authorization": f"Bearer {user_token}"}
                    )
                except Exception as e:
                    logger.error(f"작업 실패 처리 중 오류: {str(e)}")
                
                raise HTTPException(status_code=400, detail=error_msg)
            
            # 이미지 파일 읽기
            content = await file.read()
            if len(content) > max_file_size:
                error_msg = f"파일 크기가 너무 큽니다: {file.filename}"
                try:
                    call_main_api(
                        f"/api/qtext/jobs/{job_id}/fail",
                        method="POST",
                        data={"error_message": error_msg},
                        headers={"Authorization": f"Bearer {user_token}"}
                    )
                except Exception as e:
                    logger.error(f"작업 실패 처리 중 오류: {str(e)}")
                
                raise HTTPException(status_code=400, detail=error_msg)
            
            # 안전한 파일명으로 변환하여 추가
            safe_name = file.filename or f"image_{len(image_files)+1}.jpg"
            image_files.append((content, safe_name))
            original_filenames.append(safe_name)
            logger.info(f"파일 추가됨: {safe_name} ({len(content)/1024:.1f}KB)")
        
        # 사용자 정보 준비
        user_info = {
            "name": user_id,
            "id": user_id
        }
        
        # 이미지 배치 처리
        logger.info(f"이미지 배치 처리 시작: {len(image_files)}개 파일 (사용자: {user_id})")
        
        try:
            zip_data = await process_images_batch(image_files, user_info)
            
            # 🆕 사용자 친화적인 파일명 생성
            current_time = datetime.now().strftime("%Y%m%d_%H%M%S")
            total_images = len(image_files)
            friendly_filename = f"{user_id}_{current_time}_{total_images}개이미지.zip"
            
            # 결과 파일 저장 경로 생성
            result_dir = os.path.join(os.getcwd(), "results")
            os.makedirs(result_dir, exist_ok=True)
            result_file_path = os.path.join(result_dir, f"qtext_result_{job_id}.zip")
            
            # ZIP 파일 저장
            with open(result_file_path, "wb") as f:
                f.write(zip_data)
            
            # 처리된 파일명 목록 (원본 파일명에서 확장자만 변경)
            processed_filenames = [f.replace('.jpg', '_processed.jpg').replace('.png', '_processed.png').replace('.gif', '_processed.gif') for f in original_filenames]
            
            # 작업 완료 처리 (메인 API 호출)
            try:
                completion_data = {
                    "result_file_path": result_file_path,
                    "processed_files": json.dumps(processed_filenames)
                }
                
                result = call_main_api(
                    f"/api/qtext/jobs/{job_id}/complete",
                    method="POST",
                    data=completion_data,
                    headers={"Authorization": f"Bearer {user_token}"}
                )
                
                logger.info(f"작업 완료 처리 성공: {result}")
                
            except Exception as e:
                logger.error(f"작업 완료 처리 중 오류: {str(e)}")
                # 작업 완료 처리 실패 시에도 결과는 반환
                pass
            
            # 🆕 ZIP 파일로 응답 (사용자 친화적인 파일명 사용)
            return Response(
                content=zip_data,
                media_type="application/zip",
                headers={
                    "Content-Disposition": f"attachment; filename*=UTF-8''{friendly_filename}"
                }
            )
            
        except Exception as processing_error:
            logger.error(f"이미지 처리 중 오류: {str(processing_error)}")
            
            # 작업 실패 처리
            try:
                call_main_api(
                    f"/api/qtext/jobs/{job_id}/fail",
                    method="POST",
                    data={"error_message": f"이미지 처리 중 오류: {str(processing_error)}"},
                    headers={"Authorization": f"Bearer {user_token}"}
                )
            except Exception as e:
                logger.error(f"작업 실패 처리 중 오류: {str(e)}")
            
            raise HTTPException(status_code=500, detail=f"이미지 처리 중 오류가 발생했습니다: {str(processing_error)}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"이미지 처리 중 예상치 못한 오류 발생: {str(e)}")
        
        # 작업 실패 처리
        try:
            call_main_api(
                f"/api/qtext/jobs/{job_id}/fail",
                method="POST",
                data={"error_message": f"예상치 못한 오류: {str(e)}"},
                headers={"Authorization": f"Bearer {user_token}"}
            )
        except Exception as api_error:
            logger.error(f"작업 실패 처리 중 오류: {str(api_error)}")
        
        raise HTTPException(status_code=500, detail=f"이미지 처리 중 오류가 발생했습니다: {str(e)}")

# 서버 실행 (Railway 배포용)
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8003))
    uvicorn.run("main:app", host="0.0.0.0", port=port) 