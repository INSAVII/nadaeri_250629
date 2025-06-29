from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
import shutil
from datetime import datetime

from database import get_db
from models.board import Board, BoardFile
from api.auth import get_current_user, get_optional_user
from models.user import User

router = APIRouter(prefix="/api/boards", tags=["boards"])

# 파일 업로드 디렉토리 설정
UPLOAD_DIR = "uploads/boards"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 허용되는 파일 확장자
ALLOWED_EXTENSIONS = {'.txt', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar', '.jpg', '.jpeg', '.png', '.gif'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def is_allowed_file(filename: str) -> bool:
    """허용된 파일 확장자인지 확인"""
    return '.' in filename and \
           '.' + filename.rsplit('.', 1)[1].lower() in [ext.lstrip('.') for ext in ALLOWED_EXTENSIONS]

def get_file_extension(filename: str) -> str:
    """파일 확장자 추출"""
    return '.' + filename.rsplit('.', 1)[1].lower() if '.' in filename else ''


@router.get("/", response_model=List[dict])
async def get_boards(
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """게시글 목록 조회"""
    query = db.query(Board)
    
    # 카테고리 필터
    if category and category != "전체":
        query = query.filter(Board.category == category)
    
    # 검색 필터
    if search:
        query = query.filter(
            (Board.title.contains(search)) |
            (Board.content.contains(search)) |
            (Board.author.contains(search))
        )
    
    # 정렬: 상단고정 먼저, 그 다음 최신순
    query = query.order_by(Board.is_pinned.desc(), Board.created_at.desc())
    
    boards = query.offset(skip).limit(limit).all()
    
    # 응답 데이터 변환
    result = []
    for board in boards:
        result.append({
            "id": board.id,
            "title": board.title,
            "content": board.content,
            "category": board.category,
            "author": board.author,
            "is_pinned": board.is_pinned,
            "is_notice": board.is_notice,
            "view_count": board.view_count,
            "created_at": board.created_at.isoformat(),
            "updated_at": board.updated_at.isoformat(),
            "file_count": len(board.files),
            "files": [
                {
                    "id": f.id,
                    "original_filename": f.original_filename,
                    "file_size": f.file_size,
                    "content_type": f.content_type
                } for f in board.files
            ]
        })
    
    return result


@router.get("/{board_id}")
async def get_board(board_id: int, db: Session = Depends(get_db)):
    """개별 게시글 조회"""
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    
    # 조회수 증가
    board.view_count += 1
    db.commit()
    
    return {
        "id": board.id,
        "title": board.title,
        "content": board.content,
        "category": board.category,
        "author": board.author,
        "is_pinned": board.is_pinned,
        "is_notice": board.is_notice,
        "view_count": board.view_count,
        "created_at": board.created_at.isoformat(),
        "updated_at": board.updated_at.isoformat(),
        "files": [
            {
                "id": f.id,
                "original_filename": f.original_filename,
                "file_size": f.file_size,
                "content_type": f.content_type,
                "upload_date": f.upload_date.isoformat()
            } for f in board.files
        ]
    }


@router.post("/")
async def create_board(
    title: str = Form(...),
    content: str = Form(...),
    category: str = Form("일반"),
    is_pinned: bool = Form(False),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """새 게시글 작성"""
    
    # 임시: Mock 사용자 처리 (실제 운영에서는 제거 필요)
    if not current_user:
        # Mock 사용자 생성 (임시 해결책)
        mock_user = User(
            id="1",
            user_id="testuser",
            email="test@example.com",
            name="테스트 사용자",
            role="user",  # is_admin 대신 role 사용
            is_active=True
        )
        current_user = mock_user
    
    # 권한 체크 (관리자만 상단고정, 메뉴얼, 공고 작성 가능)
    if is_pinned and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="상단고정은 관리자만 가능합니다.")
    
    if category in ["메뉴얼", "manual"] and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="메뉴얼은 관리자만 작성할 수 있습니다.")
    
    if category in ["공고", "notice"] and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="공고는 관리자만 작성할 수 있습니다.")
    
    # 게시글 생성
    board = Board(
        title=title,
        content=content,
        category=category,
        author=current_user.name,
        author_id=current_user.id,
        is_pinned=is_pinned,
        is_notice=(category == "공고")
    )
    
    db.add(board)
    db.flush()  # ID 생성을 위해 flush
    
    # 파일 업로드 처리
    uploaded_files = []
    for file in files:
        if file.filename:  # 파일이 실제로 업로드된 경우
            # 파일 검증
            if not is_allowed_file(file.filename):
                raise HTTPException(status_code=400, detail=f"지원하지 않는 파일 형식입니다: {file.filename}")
            
            # 파일 크기 검증
            content = await file.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail=f"파일 크기가 너무 큽니다: {file.filename}")
            
            # 고유한 파일명 생성
            file_extension = get_file_extension(file.filename)
            stored_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join(UPLOAD_DIR, stored_filename)
            
            # 파일 저장
            with open(file_path, "wb") as buffer:
                buffer.write(content)
            
            # 파일 정보 DB 저장
            board_file = BoardFile(
                board_id=board.id,
                original_filename=file.filename,
                stored_filename=stored_filename,
                file_path=file_path,
                file_size=len(content),
                content_type=file.content_type
            )
            db.add(board_file)
            uploaded_files.append({
                "original_filename": file.filename,
                "file_size": len(content)
            })
    
    db.commit()
    
    return {
        "message": "게시글이 작성되었습니다.",
        "board_id": board.id,
        "uploaded_files": uploaded_files
    }


@router.put("/{board_id}")
async def update_board(
    board_id: int,
    title: str = Form(...),
    content: str = Form(...),
    category: str = Form("일반"),
    is_pinned: bool = Form(False),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """게시글 수정"""
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    
    # 권한 체크
    if board.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다.")
    
    if is_pinned and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="상단고정은 관리자만 가능합니다.")
    
    if category in ["메뉴얼", "manual"] and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="메뉴얼은 관리자만 작성할 수 있습니다.")
    
    if category in ["공고", "notice"] and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="공고는 관리자만 작성할 수 있습니다.")
    
    # 게시글 업데이트
    board.title = title
    board.content = content
    board.category = category
    board.is_pinned = is_pinned
    board.is_notice = (category == "공고")
    board.updated_at = datetime.utcnow()
    
    # 새 파일 업로드 처리 (기존 파일 유지)
    uploaded_files = []
    for file in files:
        if file.filename:
            if not is_allowed_file(file.filename):
                raise HTTPException(status_code=400, detail=f"지원하지 않는 파일 형식입니다: {file.filename}")
            
            content = await file.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail=f"파일 크기가 너무 큽니다: {file.filename}")
            
            file_extension = get_file_extension(file.filename)
            stored_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join(UPLOAD_DIR, stored_filename)
            
            with open(file_path, "wb") as buffer:
                buffer.write(content)
            
            board_file = BoardFile(
                board_id=board.id,
                original_filename=file.filename,
                stored_filename=stored_filename,
                file_path=file_path,
                file_size=len(content),
                content_type=file.content_type
            )
            db.add(board_file)
            uploaded_files.append({
                "original_filename": file.filename,
                "file_size": len(content)
            })
    
    db.commit()
    
    return {
        "message": "게시글이 수정되었습니다.",
        "uploaded_files": uploaded_files
    }


@router.delete("/{board_id}")
async def delete_board(
    board_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """게시글 삭제"""
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    
    # 임시: Mock 사용자 처리 (실제 운영에서는 제거 필요)
    if not current_user:
        mock_user = User(
            id="1",
            user_id="testuser",
            email="test@example.com",
            name="테스트 사용자",
            role="admin",  # 삭제 권한을 위해 임시로 admin으로 설정
            is_active=True
        )
        current_user = mock_user
    
    # 권한 체크
    if board.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")
    
    # 첨부파일 삭제
    for file in board.files:
        try:
            if os.path.exists(file.file_path):
                os.remove(file.file_path)
        except Exception as e:
            print(f"파일 삭제 오류: {e}")
    
    # 게시글 삭제 (CASCADE로 파일 정보도 함께 삭제됨)
    db.delete(board)
    db.commit()
    
    return {"message": "게시글이 삭제되었습니다."}


@router.get("/files/{file_id}/download")
async def download_file(file_id: int, db: Session = Depends(get_db)):
    """파일 다운로드"""
    board_file = db.query(BoardFile).filter(BoardFile.id == file_id).first()
    if not board_file:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    
    if not os.path.exists(board_file.file_path):
        raise HTTPException(status_code=404, detail="파일이 서버에 존재하지 않습니다.")
    
    return FileResponse(
        path=board_file.file_path,
        filename=board_file.original_filename,
        media_type=board_file.content_type or 'application/octet-stream'
    )


@router.delete("/files/{file_id}")
async def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """첨부파일 삭제"""
    board_file = db.query(BoardFile).filter(BoardFile.id == file_id).first()
    if not board_file:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    
    # 임시: Mock 사용자 처리
    if not current_user:
        mock_user = User(
            id="1",
            user_id="testuser",
            email="test@example.com",
            name="테스트 사용자",
            role="admin",
            is_active=True
        )
        current_user = mock_user
    
    # 권한 체크
    board = board_file.board
    if board.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="파일 삭제 권한이 없습니다.")
    
    # 실제 파일 삭제
    try:
        if os.path.exists(board_file.file_path):
            os.remove(board_file.file_path)
    except Exception as e:
        print(f"파일 삭제 오류: {e}")
    
    # DB에서 파일 정보 삭제
    db.delete(board_file)
    db.commit()
    
    return {"message": "파일이 삭제되었습니다."}
