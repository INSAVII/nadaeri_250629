from fastapi import APIRouter, HTTPException, Depends, Form, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import json
import os

from database import get_db
from models.user import User
from models.qtext_job import QTextJob
from models.transaction import Transaction, TransactionType
from api.auth import get_current_user
from api.deposits import update_user_balance

router = APIRouter(prefix="/api/qtext", tags=["QText"])

class QTextJobResponse(BaseModel):
    id: str
    user_id: str
    file_count: int
    unit_price: float
    total_amount: float
    status: str
    original_files: Optional[str]
    processed_files: Optional[str]
    result_file_path: Optional[str]
    error_message: Optional[str]
    processing_started_at: Optional[datetime]
    processing_completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class QTextJobCreate(BaseModel):
    file_count: int
    unit_price: float

@router.post("/jobs", response_model=QTextJobResponse)
async def create_qtext_job(
    job_data: QTextJobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """새로운 QText 작업을 생성합니다."""
    try:
        # 잔액 확인
        total_amount = job_data.file_count * job_data.unit_price
        if current_user.balance < total_amount:
            raise HTTPException(
                status_code=400, 
                detail=f"잔액이 부족합니다. 필요: {total_amount}원, 현재: {current_user.balance}원"
            )
        
        # 작업 생성
        job = QTextJob.create_job(
            user_id=current_user.id,
            file_count=job_data.file_count,
            unit_price=job_data.unit_price
        )
        
        db.add(job)
        db.commit()
        db.refresh(job)
        
        return job
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"작업 생성 중 오류가 발생했습니다: {str(e)}")

@router.get("/jobs", response_model=List[QTextJobResponse])
async def get_user_qtext_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    """사용자의 QText 작업 목록을 조회합니다."""
    try:
        jobs = db.query(QTextJob).filter(
            QTextJob.user_id == current_user.id
        ).order_by(
            QTextJob.created_at.desc()
        ).offset(offset).limit(limit).all()
        
        return jobs
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"작업 목록 조회 중 오류가 발생했습니다: {str(e)}")

@router.get("/jobs/{job_id}", response_model=QTextJobResponse)
async def get_qtext_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """특정 QText 작업을 조회합니다."""
    try:
        job = db.query(QTextJob).filter(
            QTextJob.id == job_id,
            QTextJob.user_id == current_user.id
        ).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")
        
        return job
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"작업 조회 중 오류가 발생했습니다: {str(e)}")

@router.post("/jobs/{job_id}/complete")
async def complete_qtext_job(
    job_id: str,
    result_file_path: str = Form(...),
    processed_files: str = Form(...),  # JSON 문자열
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """QText 작업을 완료 처리합니다."""
    try:
        job = db.query(QTextJob).filter(
            QTextJob.id == job_id,
            QTextJob.user_id == current_user.id
        ).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")
        
        if job.status != "processing":
            raise HTTPException(status_code=400, detail="이미 처리된 작업입니다.")
        
        # 작업 완료 처리
        job.mark_completed(result_file_path, json.loads(processed_files))
        
        # 잔액 차감 및 트랜잭션 기록
        old_balance = current_user.balance
        current_user.update_balance(-job.total_amount)
        
        transaction = Transaction.create_service_usage_transaction(
            user=current_user,
            amount=job.total_amount,
            job_id=job.id,
            description=f"QText 이미지 처리: {job.file_count}개 파일"
        )
        
        db.add(transaction)
        db.commit()
        
        return {
            "status": "success",
            "message": "작업이 완료되었습니다.",
            "job_id": job.id,
            "amount_deducted": job.total_amount,
            "new_balance": current_user.balance
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"작업 완료 처리 중 오류가 발생했습니다: {str(e)}")

@router.post("/jobs/{job_id}/fail")
async def fail_qtext_job(
    job_id: str,
    error_message: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """QText 작업을 실패 처리합니다."""
    try:
        job = db.query(QTextJob).filter(
            QTextJob.id == job_id,
            QTextJob.user_id == current_user.id
        ).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")
        
        if job.status != "processing":
            raise HTTPException(status_code=400, detail="이미 처리된 작업입니다.")
        
        # 작업 실패 처리
        job.mark_failed(error_message)
        
        # 실패 시 환불 처리
        old_balance = current_user.balance
        current_user.update_balance(job.total_amount)  # 환불
        
        transaction = Transaction.create_service_usage_transaction(
            user=current_user,
            amount=-job.total_amount,  # 환불이므로 음수
            job_id=job.id,
            description=f"QText 작업 실패 환불: {job.file_count}개 파일"
        )
        
        db.add(transaction)
        db.commit()
        
        return {
            "status": "success",
            "message": "작업이 실패 처리되었습니다.",
            "job_id": job.id,
            "refund_amount": job.total_amount,
            "new_balance": current_user.balance
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"작업 실패 처리 중 오류가 발생했습니다: {str(e)}")

@router.post("/jobs/{job_id}/cancel")
async def cancel_qtext_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """QText 작업을 취소합니다."""
    try:
        job = db.query(QTextJob).filter(
            QTextJob.id == job_id,
            QTextJob.user_id == current_user.id
        ).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")
        
        if job.status != "processing":
            raise HTTPException(status_code=400, detail="이미 처리된 작업입니다.")
        
        # 작업 취소 처리
        job.mark_cancelled()
        
        # 취소 시 환불 처리
        old_balance = current_user.balance
        current_user.update_balance(job.total_amount)  # 환불
        
        transaction = Transaction.create_service_usage_transaction(
            user=current_user,
            amount=-job.total_amount,  # 환불이므로 음수
            job_id=job.id,
            description=f"QText 작업 취소 환불: {job.file_count}개 파일"
        )
        
        db.add(transaction)
        db.commit()
        
        return {
            "status": "success",
            "message": "작업이 취소되었습니다.",
            "job_id": job.id,
            "refund_amount": job.total_amount,
            "new_balance": current_user.balance
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"작업 취소 중 오류가 발생했습니다: {str(e)}")

@router.get("/stats")
async def get_qtext_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """사용자의 QText 사용 통계를 조회합니다."""
    try:
        # 전체 작업 수
        total_jobs = db.query(QTextJob).filter(
            QTextJob.user_id == current_user.id
        ).count()
        
        # 완료된 작업 수
        completed_jobs = db.query(QTextJob).filter(
            QTextJob.user_id == current_user.id,
            QTextJob.status == "completed"
        ).count()
        
        # 실패한 작업 수
        failed_jobs = db.query(QTextJob).filter(
            QTextJob.user_id == current_user.id,
            QTextJob.status == "failed"
        ).count()
        
        # 총 처리한 파일 수
        total_files = db.query(QTextJob).filter(
            QTextJob.user_id == current_user.id,
            QTextJob.status == "completed"
        ).with_entities(
            db.func.sum(QTextJob.file_count)
        ).scalar() or 0
        
        # 총 사용 금액
        total_amount = db.query(QTextJob).filter(
            QTextJob.user_id == current_user.id,
            QTextJob.status == "completed"
        ).with_entities(
            db.func.sum(QTextJob.total_amount)
        ).scalar() or 0
        
        return {
            "total_jobs": total_jobs,
            "completed_jobs": completed_jobs,
            "failed_jobs": failed_jobs,
            "total_files": total_files,
            "total_amount": total_amount,
            "success_rate": (completed_jobs / total_jobs * 100) if total_jobs > 0 else 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"통계 조회 중 오류가 발생했습니다: {str(e)}") 