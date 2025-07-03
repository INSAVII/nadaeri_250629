from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import json
import uvicorn
from dotenv import load_dotenv
import logging
from datetime import datetime
import glob
from pathlib import Path

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 환경변수 로드 - 여러 위치에서 .env 파일 찾기
possible_env_paths = [
    ".env",  # 현재 디렉토리
    "../.env",  # 상위 디렉토리 (루트)
    "../../.env",  # 루트 디렉토리
    os.path.join(os.path.dirname(__file__), ".env"),  # 스크립트 디렉토리
    os.path.join(os.path.dirname(__file__), "..", ".env"),  # 상위 디렉토리
    os.path.join(os.path.dirname(__file__), "..", "..", ".env"),  # 루트 디렉토리
]

# .env 파일 찾기 및 로드
env_loaded = False
for env_path in possible_env_paths:
    if os.path.exists(env_path):
        load_dotenv(env_path)
        logger.info(f"환경변수 파일 로드됨: {os.path.abspath(env_path)}")
        env_loaded = True
        break

if not env_loaded:
    logger.warning("어떤 .env 파일도 찾을 수 없습니다. 기본값을 사용합니다.")
    load_dotenv()  # 기본 동작

logger.info("큐네임 서비스 환경변수 로드 완료")

# 큐네임 프로세서 임포트
from processor import process_file, check_api_keys

app = FastAPI(
    title="QName Service", 
    description="QName 서비스 API (상품명 생성) - 리팩터링 버전",
    version="2.0.0"
)

# CORS 미들웨어 설정
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3003,http://localhost:3001,http://localhost:3002,https://qclick-app.vercel.app").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info(f"큐네임 서비스 CORS 설정 완료: {cors_origins}")

@app.get("/", tags=["루트"])
async def root():
    return {"message": "QName 서비스에 오신 것을 환영합니다.", "version": "2.0.0"}

@app.get("/health", tags=["상태"])
async def health_check():
    return {"status": "ok", "message": "QName 서비스가 정상 작동 중입니다.", "version": "2.0.0"}

@app.post("/api/qname/process-file", tags=["큐네임"])
async def process_excel_file(
    file: UploadFile = File(...)
):
    """엑셀 파일을 업로드하여 상품명을 생성합니다."""
    temp_file_path = None
    try:
        logger.info(f"=== 파일 처리 요청 시작 ===")
        logger.info(f"파일명: {file.filename}")
        logger.info(f"파일 크기: {file.size} bytes")
        logger.info(f"파일 타입: {file.content_type}")
        logger.info(f"요청 시간: {datetime.now().isoformat()}")
        
        # 파일 형식 검증
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.")
        
        # 이전 임시 파일들 정리
        for old_temp_file in glob.glob("temp_*.xlsx"):
            try:
                os.remove(old_temp_file)
                logger.info(f"이전 임시 파일 삭제: {old_temp_file}")
            except Exception as e:
                logger.warning(f"임시 파일 삭제 실패: {old_temp_file}, 오류: {e}")
        
        # 고유한 임시 파일명 생성
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        temp_file_path = f"temp_{timestamp}_{file.filename}"
        logger.info(f"임시 파일 저장: {temp_file_path}")
        
        # 파일 저장
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        logger.info(f"파일 저장 완료: {len(content)} bytes")
        
        # 파일 처리
        logger.info(f"=== 파일 처리 시작 ===")
        logger.info(f"임시 파일 경로: {temp_file_path}")
        logger.info(f"현재 작업 디렉토리: {os.getcwd()}")
        logger.info(f"임시 파일 크기: {os.path.getsize(temp_file_path)} bytes")
        
        result = process_file(temp_file_path)
        
        logger.info(f"=== 파일 처리 결과 ===")
        logger.info(f"성공 여부: {result['success']}")
        if result['success']:
            logger.info(f"총 처리 행 수: {result['total_processed']}")
            logger.info(f"성공 행 수: {result['success_count']}")
            logger.info(f"실패 행 수: {result['error_count']}")
            logger.info(f"출력 파일: {result['output_file']}")
        else:
            logger.error(f"처리 실패: {result['error']}")
        
        if not result['success']:
            logger.error(f"파일 처리 실패: {result['error']}")
            raise HTTPException(status_code=500, detail=f"파일 처리 중 오류가 발생했습니다: {result['error']}")
        
        # 결과 파일 반환
        output_file = result['output_file']
        logger.info(f"=== 결과 파일 반환 준비 ===")
        logger.info(f"결과 파일 경로: {output_file}")
        logger.info(f"결과 파일 존재 여부: {os.path.exists(output_file)}")
        
        if os.path.exists(output_file):
            file_size = os.path.getsize(output_file)
            logger.info(f"결과 파일 반환: {output_file}")
            logger.info(f"결과 파일 크기: {file_size} bytes")
            logger.info(f"처리 결과: {result['total_processed']}행 중 {result['success_count']}행 성공")
            logger.info(f"응답 전송 시간: {datetime.now().isoformat()}")
            
            return FileResponse(
                output_file,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                filename=f"가공완료_상품명카테키워드.xlsx"
            )
        else:
            logger.error("결과 파일이 생성되지 않았습니다.")
            raise HTTPException(status_code=500, detail="결과 파일 생성에 실패했습니다.")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"파일 처리 중 예상치 못한 오류 발생: {str(e)}")
        logger.error(f"오류 타입: {type(e).__name__}")
        logger.error(f"오류 스택: {e}")
        raise HTTPException(status_code=500, detail=f"파일 처리 중 오류가 발생했습니다: {str(e)}")
    finally:
        # 임시 파일 정리
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                logger.info(f"임시 파일 정리 완료: {temp_file_path}")
            except Exception as e:
                logger.warning(f"임시 파일 정리 실패: {temp_file_path}, 오류: {e}")

@app.post("/api/qname/generate-single", tags=["큐네임"])
async def generate_single_name(
    keyword: str = Form(...)
):
    """단일 키워드로 상품명을 생성합니다."""
    try:
        logger.info(f"단일 상품명 생성 요청: keyword={keyword}")
        
        # 임시 파일 생성
        import pandas as pd
        temp_df = pd.DataFrame({
            '상품코드': ['TEMP001'],
            '메인키워드': [keyword]
        })
        
        temp_file = f"temp_single_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        temp_df.to_excel(temp_file, index=False)
        
        # 파일 처리
        result = process_file(temp_file)
        
        # 임시 파일 삭제
        try:
            os.remove(temp_file)
        except:
            pass
        
        if not result['success']:
            raise HTTPException(status_code=500, detail=f"상품명 생성에 실패했습니다: {result['error']}")
        
        # 결과 읽기
        output_df = pd.read_excel(result['output_file'])
        if len(output_df) > 0:
            row = output_df.iloc[0]
            return {
                "status": "success",
                "data": {
                    "keyword": keyword,
                    "product_name": row.get('SEO상품명', ''),
                    "category_code": row.get('NAVERCODE', ''),
                    "category_format": row.get('카테분류형식', ''),
                    "related_keywords": row.get('연관검색어', ''),
                    "naver_tags": row.get('네이버태그', '')
                },
                "message": "상품명이 생성되었습니다."
            }
        else:
            raise HTTPException(status_code=500, detail="상품명 생성 결과를 읽을 수 없습니다.")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"단일 상품명 생성 중 오류 발생: {str(e)}")
        raise HTTPException(status_code=500, detail=f"상품명 생성 중 오류가 발생했습니다: {str(e)}")

@app.get("/api/qname/health", tags=["상태"])
async def qname_health_check():
    """QName 서비스의 상세 상태를 확인합니다."""
    try:
        # API 키 확인
        api_keys_ok = check_api_keys()
        
        return {
            "status": "ok",
            "api_keys": "configured" if api_keys_ok else "missing",
            "version": "2.0.0",
            "message": "QName 서비스 상태 확인 완료"
        }
    except Exception as e:
        logger.error(f"상태 확인 중 오류 발생: {str(e)}")
        return {
            "status": "error",
            "message": f"상태 확인 중 오류가 발생했습니다: {str(e)}"
        }

# 서버 실행
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8004))
    logger.info(f"QName 서비스 시작 - 포트: {port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, log_level="info") 