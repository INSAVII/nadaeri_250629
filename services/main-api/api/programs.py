from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import base64
import uuid
from datetime import datetime

from database import get_db
from models.program import ProgramFile, Program
from api.auth import get_current_admin_user, get_current_active_user
from models.user import User

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
    활성화된 프로그램 파일 목록을 조회합니다.
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

        # license_type에 따른 프로그램 ID 결정 (실제 데이터베이스 ID 사용)
        if license_type == 'free':
            program_id = 'free'  # 실제 데이터베이스 ID
        elif license_type == 'month1':
            program_id = 'month1'  # 실제 데이터베이스 ID
        elif license_type == 'month3':
            program_id = 'month3'  # 실제 데이터베이스 ID
        else:
            raise HTTPException(status_code=400, detail="유효하지 않은 라이센스 타입입니다")

        # 데이터베이스에서 프로그램 조회
        program = db.query(Program).filter(Program.id == program_id).first()
        if not program:
            raise HTTPException(status_code=404, detail=f"프로그램을 찾을 수 없습니다 (ID: {program_id})")

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
                "program_name": program.name
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