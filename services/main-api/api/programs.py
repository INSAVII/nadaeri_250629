from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import base64
import uuid
import logging
from datetime import datetime

from database import get_db
from models.program import ProgramFile, Program, PriceSettings
from api.auth import get_current_admin_user, get_current_active_user
from models.user import User

# 로거 설정
logger = logging.getLogger(__name__)

router = APIRouter()

# 파일 저장 디렉토리
UPLOAD_DIR = "uploads/programs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Pydantic 모델
from pydantic import BaseModel

class ProgramFileResponse(BaseModel):
    id: str
    name: str
    filename: str
    file_size: Optional[int]
    license_type: str
    is_active: bool
    upload_date: datetime

    class Config:
        from_attributes = True

class ProgramUploadResponse(BaseModel):
    success: bool
    message: str
    program: ProgramFileResponse

@router.post("/upload-program", response_model=ProgramUploadResponse)
async def upload_program(
    file: UploadFile = File(...),
    license_type: str = Form(...),
    name: str = Form(...),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    관리자가 프로그램 파일을 업로드합니다.
    """
    try:
        # 파일 크기 검증 (100MB)
        max_size = 100 * 1024 * 1024
        if file.size > max_size:
            raise HTTPException(status_code=400, detail="파일 크기가 너무 큽니다. 최대 100MB까지 업로드 가능합니다.")

        # 파일 확장자 검증
        allowed_extensions = ['.exe', '.dmg', '.zip', '.msi', '.pkg']
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail="지원하지 않는 파일 형식입니다.")

        # 기존 파일이 있으면 비활성화
        existing_file = db.query(ProgramFile).filter(
            ProgramFile.license_type == license_type,
            ProgramFile.is_active == True
        ).first()
        
        if existing_file:
            existing_file.is_active = False
            db.commit()

        # 파일 내용 읽기
        file_content = await file.read()
        
        # 파일을 서버에 저장
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(file_path, "wb") as f:
            f.write(file_content)

        # 파일 내용을 base64로 인코딩 (100MB 이하 파일만)
        file_content_b64 = None
        if len(file_content) <= 100 * 1024 * 1024:  # 100MB
            file_content_b64 = base64.b64encode(file_content).decode('utf-8')

        # 데이터베이스에 저장
        program_file = ProgramFile(
            name=name,
            filename=file.filename,
            file_path=file_path,
            file_size=len(file_content),
            license_type=license_type,
            is_active=True,
            file_content=file_content_b64,
            content_type=file.content_type or "application/octet-stream"
        )
        
        db.add(program_file)
        db.commit()
        db.refresh(program_file)

        return ProgramUploadResponse(
            success=True,
            message=f"{name} 파일이 성공적으로 업로드되었습니다.",
            program=ProgramFileResponse(
                id=program_file.id,
                name=program_file.name,
                filename=program_file.filename,
                file_size=program_file.file_size,
                license_type=program_file.license_type,
                is_active=program_file.is_active,
                upload_date=program_file.upload_date
            )
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 업로드 중 오류가 발생했습니다: {str(e)}")

@router.get("/programs", response_model=List[ProgramFileResponse])
async def get_programs(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    활성화된 프로그램 파일 목록을 조회합니다. (관리자 전용)
    """
    try:
        programs = db.query(ProgramFile).filter(ProgramFile.is_active == True).all()
        return [
            ProgramFileResponse(
                id=program.id,
                name=program.name,
                filename=program.filename,
                file_size=program.file_size,
                license_type=program.license_type,
                is_active=program.is_active,
                upload_date=program.upload_date
            )
            for program in programs
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프로그램 목록 조회 중 오류가 발생했습니다: {str(e)}")

@router.get("/public-programs", response_model=List[ProgramFileResponse])
async def get_public_programs(
    db: Session = Depends(get_db)
):
    """
    활성화된 프로그램 파일 목록을 조회합니다. (공개 접근 가능)
    """
    try:
        programs = db.query(ProgramFile).filter(ProgramFile.is_active == True).all()
        return [
            ProgramFileResponse(
                id=program.id,
                name=program.name,
                filename=program.filename,
                file_size=program.file_size,
                license_type=program.license_type,
                is_active=program.is_active,
                upload_date=program.upload_date
            )
            for program in programs
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프로그램 목록 조회 중 오류가 발생했습니다: {str(e)}")

@router.get("/download-program/{program_id}")
async def download_program(
    program_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    프로그램 파일을 다운로드합니다.
    """
    try:
        program = db.query(ProgramFile).filter(ProgramFile.id == program_id).first()
        if not program:
            raise HTTPException(status_code=404, detail="프로그램 파일을 찾을 수 없습니다.")

        if not program.is_active:
            raise HTTPException(status_code=400, detail="비활성화된 프로그램입니다.")

        # 파일이 존재하는지 확인
        if not os.path.exists(program.file_path):
            raise HTTPException(status_code=404, detail="파일이 서버에 존재하지 않습니다.")

        return FileResponse(
            path=program.file_path,
            filename=program.filename,
            media_type=program.content_type
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 다운로드 중 오류가 발생했습니다: {str(e)}")

@router.delete("/delete-program/{program_id}")
async def delete_program(
    program_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    프로그램 파일을 삭제합니다.
    """
    try:
        program = db.query(ProgramFile).filter(ProgramFile.id == program_id).first()
        if not program:
            raise HTTPException(status_code=404, detail="프로그램 파일을 찾을 수 없습니다.")

        # 파일 시스템에서 삭제
        if os.path.exists(program.file_path):
            os.remove(program.file_path)

        # 데이터베이스에서 삭제
        db.delete(program)
        db.commit()

        return {"success": True, "message": f"{program.name} 파일이 삭제되었습니다."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 삭제 중 오류가 발생했습니다: {str(e)}")

# 사용자용 다운로드 API (권한 확인 포함)
@router.get("/user/download-program/{license_type}")
async def user_download_program(
    license_type: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    사용자가 권한이 있는 프로그램을 다운로드합니다.
    """
    try:
        # 사용자 권한 확인
        if license_type == "free" and not current_user.program_permissions_free:
            raise HTTPException(status_code=403, detail="무료 프로그램 사용 권한이 없습니다.")
        elif license_type == "month1" and not current_user.program_permissions_month1:
            raise HTTPException(status_code=403, detail="1개월 프로그램 사용 권한이 없습니다.")
        elif license_type == "month3" and not current_user.program_permissions_month3:
            raise HTTPException(status_code=403, detail="3개월 프로그램 사용 권한이 없습니다.")

        # 🆕 license_type을 실제 데이터베이스 형식으로 매핑
        db_license_type = None
        if license_type == 'free':
            db_license_type = 'qcapture_free'
        elif license_type == 'month1':
            db_license_type = 'qcapture_month1'
        elif license_type == 'month3':
            db_license_type = 'qcapture_month3'
        else:
            raise HTTPException(status_code=400, detail="유효하지 않은 라이센스 타입입니다")

        # 활성화된 프로그램 파일 찾기 (수정된 license_type 사용)
        program_file = db.query(ProgramFile).filter(
            ProgramFile.license_type == db_license_type,
            ProgramFile.is_active == True
        ).first()

        if not program_file:
            raise HTTPException(status_code=404, detail="해당 라이센스 타입의 프로그램 파일을 찾을 수 없습니다.")

        # 파일이 존재하는지 확인
        if not os.path.exists(program_file.file_path):
            raise HTTPException(status_code=404, detail="파일이 서버에 존재하지 않습니다.")

        # 🆕 파일 정보를 JSON으로 반환 (실제 파일명 포함)
        return {
            "success": True,
            "message": "파일 다운로드 정보",
            "data": {
                "filename": program_file.filename,  # 실제 업로드된 파일명
                "file_path": program_file.file_path,
                "content_type": program_file.content_type,
                "file_size": program_file.file_size,
                "program_name": program_file.name
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 다운로드 중 오류가 발생했습니다: {str(e)}")

# 🆕 실제 파일 다운로드 엔드포인트
@router.get("/user/download-file/{license_type}")
async def download_actual_file(
    license_type: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    실제 파일을 다운로드합니다.
    """
    try:
        # 사용자 권한 확인
        if license_type == "free" and not current_user.program_permissions_free:
            raise HTTPException(status_code=403, detail="무료 프로그램 사용 권한이 없습니다.")
        elif license_type == "month1" and not current_user.program_permissions_month1:
            raise HTTPException(status_code=403, detail="1개월 프로그램 사용 권한이 없습니다.")
        elif license_type == "month3" and not current_user.program_permissions_month3:
            raise HTTPException(status_code=403, detail="3개월 프로그램 사용 권한이 없습니다.")

        # 🆕 license_type을 실제 데이터베이스 형식으로 매핑
        db_license_type = None
        if license_type == 'free':
            db_license_type = 'qcapture_free'
        elif license_type == 'month1':
            db_license_type = 'qcapture_month1'
        elif license_type == 'month3':
            db_license_type = 'qcapture_month3'
        else:
            raise HTTPException(status_code=400, detail="유효하지 않은 라이센스 타입입니다")

        # 활성화된 프로그램 파일 찾기
        program_file = db.query(ProgramFile).filter(
            ProgramFile.license_type == db_license_type,
            ProgramFile.is_active == True
        ).first()

        if not program_file:
            raise HTTPException(status_code=404, detail="해당 라이센스 타입의 프로그램 파일을 찾을 수 없습니다.")

        # 파일이 존재하는지 확인
        if not os.path.exists(program_file.file_path):
            raise HTTPException(status_code=404, detail="파일이 서버에 존재하지 않습니다.")

        # 실제 파일 다운로드
        return FileResponse(
            path=program_file.file_path,
            filename=program_file.filename,  # 실제 업로드된 파일명 사용
            media_type=program_file.content_type
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 다운로드 중 오류가 발생했습니다: {str(e)}")

# 가격 설정 Pydantic 모델
class PriceSettingsRequest(BaseModel):
    qcapture_month1_price: int
    qcapture_month3_price: int

class PriceSettingsResponse(BaseModel):
    success: bool
    message: str
    prices: PriceSettingsRequest

# 가격 설정 조회 API
@router.get("/price-settings", response_model=PriceSettingsResponse)
async def get_price_settings(
    db: Session = Depends(get_db)
):
    """
    현재 가격 설정을 조회합니다.
    """
    try:
        # 데이터베이스에서 가격 설정 조회
        # 1개월 가격 조회
        month1_price_setting = db.query(PriceSettings).filter(
            PriceSettings.service_type == "qcapture_month1"
        ).first()
        
        # 3개월 가격 조회
        month3_price_setting = db.query(PriceSettings).filter(
            PriceSettings.service_type == "qcapture_month3"
        ).first()
        
        # 기본값 설정
        month1_price = month1_price_setting.price if month1_price_setting else 50000
        month3_price = month3_price_setting.price if month3_price_setting else 120000
        
        prices = PriceSettingsRequest(
            qcapture_month1_price=month1_price,
            qcapture_month3_price=month3_price
        )
        
        return PriceSettingsResponse(
            success=True,
            message="가격 설정 조회 성공",
            prices=prices
        )
    except Exception as e:
        logger.error(f"가격 설정 조회 실패: {e}")
        raise HTTPException(status_code=500, detail="가격 설정 조회에 실패했습니다.")

# 가격 설정 업데이트 API (관리자 전용)
@router.put("/price-settings", response_model=PriceSettingsResponse)
async def update_price_settings(
    prices: PriceSettingsRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    가격 설정을 업데이트합니다. (관리자 전용)
    """
    try:
        # 1개월 가격 업데이트
        month1_setting = db.query(PriceSettings).filter(
            PriceSettings.service_type == "qcapture_month1"
        ).first()
        
        if month1_setting:
            month1_setting.price = prices.qcapture_month1_price
            month1_setting.updated_by = current_user.id
        else:
            month1_setting = PriceSettings(
                service_type="qcapture_month1",
                price=prices.qcapture_month1_price,
                updated_by=current_user.id
            )
            db.add(month1_setting)
        
        # 3개월 가격 업데이트
        month3_setting = db.query(PriceSettings).filter(
            PriceSettings.service_type == "qcapture_month3"
        ).first()
        
        if month3_setting:
            month3_setting.price = prices.qcapture_month3_price
            month3_setting.updated_by = current_user.id
        else:
            month3_setting = PriceSettings(
                service_type="qcapture_month3",
                price=prices.qcapture_month3_price,
                updated_by=current_user.id
            )
            db.add(month3_setting)
        
        db.commit()
        
        logger.info(f"가격 설정 업데이트 완료: {current_user.id} - 1개월: {prices.qcapture_month1_price}원, 3개월: {prices.qcapture_month3_price}원")
        
        return PriceSettingsResponse(
            success=True,
            message="가격 설정이 업데이트되었습니다.",
            prices=PriceSettingsRequest(
                qcapture_month1_price=prices.qcapture_month1_price,
                qcapture_month3_price=prices.qcapture_month3_price
            )
        )
    except Exception as e:
        db.rollback()
        logger.error(f"가격 설정 업데이트 실패: {e}")
        raise HTTPException(status_code=500, detail="가격 설정 업데이트에 실패했습니다.") 