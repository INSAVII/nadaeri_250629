from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from pydantic import BaseModel
from datetime import datetime
from pathlib import Path
import shutil
import uuid
import os
from database import get_db
from models import Manual
from api.auth import get_current_admin_user

router = APIRouter(tags=["manuals"])

# 파일 업로드 디렉토리 설정
UPLOAD_DIR = Path("uploads/manuals")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Pydantic 모델
class ManualBase(BaseModel):
    page_key: str
    title: str
    content: str
    is_active: Optional[bool] = True

class ManualCreate(ManualBase):
    pass

class ManualUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_active: Optional[bool] = None

class ManualResponse(ManualBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# 파일 업로드 관련 모델
class ManualFileResponse(BaseModel):
    id: str
    filename: str
    original_name: str
    upload_date: str
    size: int
    type: str
    download_url: str

class ManualDataResponse(BaseModel):
    service: str
    content: str
    files: List[ManualFileResponse]
    last_updated: str

# API 엔드포인트
@router.post("", response_model=ManualResponse)
async def create_manual(
    manual: ManualCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """관리자가 새 사용설명서를 생성합니다 (관리자 전용)"""
    # 페이지 키가 이미 존재하는지 확인
    existing_manual = db.query(Manual).filter(Manual.page_key == manual.page_key).first()
    if existing_manual:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"페이지 키 '{manual.page_key}'에 대한 설명서가 이미 존재합니다"
        )
    
    # 새 설명서 생성
    db_manual = Manual(**manual.dict())
    db.add(db_manual)
    db.commit()
    db.refresh(db_manual)
    return db_manual

@router.get("", response_model=List[ManualResponse])
async def get_all_manuals(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """모든 사용설명서 목록을 조회합니다 (관리자 전용)"""
    manuals = db.query(Manual).all()
    return manuals

@router.get("/public/{page_key}", response_model=ManualResponse)
async def get_manual_by_page_key(
    page_key: str,
    db: Session = Depends(get_db)
):
    """특정 페이지의 사용설명서를 조회합니다 (공개)"""
    manual = db.query(Manual).filter(Manual.page_key == page_key, Manual.is_active == True).first()
    if not manual:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"페이지 키 '{page_key}'에 대한 설명서를 찾을 수 없습니다"
        )
    return manual

@router.get("/{manual_id}", response_model=ManualResponse)
async def get_manual_by_id(
    manual_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """사용설명서를 ID로 조회합니다 (관리자 전용)"""
    manual = db.query(Manual).filter(Manual.id == manual_id).first()
    if not manual:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ID '{manual_id}'에 대한 설명서를 찾을 수 없습니다"
        )
    return manual

@router.put("/{manual_id}", response_model=ManualResponse)
async def update_manual(
    manual_id: str,
    manual_update: ManualUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """사용설명서를 업데이트합니다 (관리자 전용)"""
    db_manual = db.query(Manual).filter(Manual.id == manual_id).first()
    if not db_manual:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ID '{manual_id}'에 대한 설명서를 찾을 수 없습니다"
        )
    
    # 업데이트할 필드 적용
    update_data = manual_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_manual, key, value)
    
    db.commit()
    db.refresh(db_manual)
    return db_manual

@router.delete("/{manual_id}", response_model=Dict)
async def delete_manual(
    manual_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """사용설명서를 삭제합니다 (관리자 전용)"""
    db_manual = db.query(Manual).filter(Manual.id == manual_id).first()
    if not db_manual:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ID '{manual_id}'에 대한 설명서를 찾을 수 없습니다"
        )
    
    db.delete(db_manual)
    db.commit()
    
    return {"message": f"ID '{manual_id}'에 대한 설명서가 삭제되었습니다"}

# 공개 엔드포인트 (인증 불필요)
@router.get("/public/{page_key}", response_model=ManualResponse)
async def get_public_manual(
    page_key: str,
    db: Session = Depends(get_db)
):
    """페이지 키로 공개된 사용설명서를 조회합니다 (인증 불필요)"""
    manual = db.query(Manual).filter(
        Manual.page_key == page_key,
        Manual.is_active == True
    ).first()
    
    if not manual:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"페이지 키 '{page_key}'에 대한 활성화된 설명서를 찾을 수 없습니다"
        )
    
    return manual

# 메뉴얼 파일 업로드 API
@router.post("/upload/{service}")
async def upload_manual_files(
    service: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """메뉴얼 파일을 업로드합니다 (관리자 전용)"""
    if service not in ['qcapture', 'qname', 'qtext']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="잘못된 서비스입니다. qcapture, qname, qtext 중 하나여야 합니다."
        )
    
    # 파일 개수 제한 체크 (최대 5개)
    if len(files) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="최대 5개의 파일만 업로드할 수 있습니다."
        )
    
    uploaded_files = []
    
    for file in files:
        # 파일 크기 체크 (50MB)
        max_size = 50 * 1024 * 1024  # 50MB
        file_content = await file.read()
        if len(file_content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"파일 '{file.filename}'의 크기가 50MB를 초과합니다."
            )
        
        # 파일 확장자 체크
        allowed_extensions = ['.pdf', '.doc', '.docx', '.txt', '.hwp']
        file_extension = '.' + file.filename.split('.')[-1].lower()
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"지원하지 않는 파일 형식입니다: {file.filename}"
            )
        
        # 고유한 파일명 생성
        file_id = str(uuid.uuid4())
        filename = f"{service}_{file_id}_{file.filename}"
        file_path = UPLOAD_DIR / filename
        
        # 파일 저장
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        uploaded_files.append({
            "id": file_id,
            "filename": filename,
            "original_name": file.filename,
            "upload_date": datetime.now().isoformat()[:10],
            "size": len(file_content),
            "type": file.content_type or "application/octet-stream",
            "download_url": f"/api/manuals/download/{filename}"
        })
    
    return {
        "message": f"{len(uploaded_files)}개 파일이 업로드되었습니다.",
        "files": uploaded_files
    }

# 메뉴얼 파일 다운로드 API
@router.get("/download/{filename}")
async def download_manual_file(filename: str):
    """메뉴얼 파일을 다운로드합니다"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="파일을 찾을 수 없습니다."
        )
    
    from fastapi.responses import FileResponse
    return FileResponse(file_path, filename=filename)

# 메뉴얼 파일 삭제 API
@router.delete("/file/{filename}")
async def delete_manual_file(
    filename: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """메뉴얼 파일을 삭제합니다 (관리자 전용)"""
    file_path = UPLOAD_DIR / filename
    if file_path.exists():
        os.remove(file_path)
    
    return {"message": "파일이 삭제되었습니다."}

# 서비스별 메뉴얼 데이터 가져오기 (공개)
@router.get("/service/{service}")
async def get_manual_by_service(
    service: str,
    db: Session = Depends(get_db)
):
    """서비스별 메뉴얼 데이터를 가져옵니다 (공개)"""
    if service not in ['qcapture', 'qname', 'qtext']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="잘못된 서비스입니다. qcapture, qname, qtext 중 하나여야 합니다."
        )
    
    # 메뉴얼 내용 가져오기
    manual = db.query(Manual).filter(
        Manual.page_key == service,
        Manual.is_active == True
    ).first()
    
    content = manual.content if manual else ""
    
    # 업로드된 파일 목록 가져오기
    files = []
    if UPLOAD_DIR.exists():
        for file_path in UPLOAD_DIR.glob(f"{service}_*"):
            if file_path.is_file():
                stat = file_path.stat()
                files.append({
                    "id": file_path.stem.split('_')[1] if len(file_path.stem.split('_')) > 1 else "unknown",
                    "filename": file_path.name,
                    "original_name": '_'.join(file_path.name.split('_')[2:]) if len(file_path.name.split('_')) > 2 else file_path.name,
                    "upload_date": datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d'),
                    "size": stat.st_size,
                    "type": "application/octet-stream",
                    "download_url": f"/api/manuals/download/{file_path.name}"
                })
    
    return {
        "service": service,
        "content": content,
        "files": files,
        "last_updated": manual.updated_at.strftime('%Y-%m-%d') if manual else datetime.now().strftime('%Y-%m-%d')
    }

# 서비스별 메뉴얼 데이터 업데이트 (관리자 전용)
@router.put("/service/{service}")
async def update_manual_by_service(
    service: str,
    content: str = Form(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """서비스별 메뉴얼 내용을 업데이트합니다 (관리자 전용)"""
    if service not in ['qcapture', 'qname', 'qtext']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="잘못된 서비스입니다. qcapture, qname, qtext 중 하나여야 합니다."
        )
    
    # 기존 메뉴얼 찾기 또는 새로 생성
    manual = db.query(Manual).filter(Manual.page_key == service).first()
    
    if manual:
        # 기존 메뉴얼 업데이트
        manual.content = content
        manual.updated_at = datetime.now()
    else:
        # 새 메뉴얼 생성
        service_titles = {
            'qcapture': '큐캡쳐 사용법',
            'qname': '큐네임 사용법', 
            'qtext': '큐텍스트 사용법'
        }
        manual = Manual(
            page_key=service,
            title=service_titles.get(service, f'{service} 사용법'),
            content=content,
            is_active=True
        )
        db.add(manual)
    
    db.commit()
    db.refresh(manual)
    
    return {"message": f"{service} 메뉴얼이 업데이트되었습니다."}
