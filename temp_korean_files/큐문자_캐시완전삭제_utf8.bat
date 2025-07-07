@echo off
chcp 65001 >nul
echo ========================================
echo QText 서비스 캐시 완전 삭제
echo ========================================
echo.

echo 현재 디렉토리: %CD%
echo.

echo 🧹 QText 서비스 캐시 삭제 시작...
echo.

echo 1. QText 서비스 Python 캐시 삭제...
if exist "services\qtext-service\__pycache__" (
    rmdir /s /q "services\qtext-service\__pycache__"
    echo ✅ QText Python 캐시 삭제 완료
) else (
    echo ℹ️ QText Python 캐시가 없습니다
)

echo.
echo 2. QText 서비스 임시 결과 파일 삭제...
if exist "services\qtext-service\results" (
    rmdir /s /q "services\qtext-service\results"
    echo ✅ QText 결과 파일 삭제 완료
) else (
    echo ℹ️ QText 결과 파일이 없습니다
)

echo.
echo 3. 메인 API Python 캐시 삭제 (QText 연동)...
if exist "services\main-api\__pycache__" (
    rmdir /s /q "services\main-api\__pycache__"
    echo ✅ 메인 API Python 캐시 삭제 완료
) else (
    echo ℹ️ 메인 API Python 캐시가 없습니다
)

echo.
echo 4. 프론트엔드 캐시 삭제 (QText 페이지)...
if exist "frontend\.parcel-cache" (
    rmdir /s /q "frontend\.parcel-cache"
    echo ✅ 프론트엔드 Parcel 캐시 삭제 완료
) else (
    echo ℹ️ 프론트엔드 Parcel 캐시가 없습니다
)

if exist "frontend\node_modules\.cache" (
    rmdir /s /q "frontend\node_modules\.cache"
    echo ✅ 프론트엔드 Node 캐시 삭제 완료
) else (
    echo ℹ️ 프론트엔드 Node 캐시가 없습니다
)

echo.
echo 5. 포트 사용 중인 프로세스 확인...
echo.
echo 🔍 포트 8001 (메인 API) 사용 중인 프로세스:
netstat -ano | findstr :8001

echo.
echo 🔍 포트 8003 (QText 서비스) 사용 중인 프로세스:
netstat -ano | findstr :8003

echo.
echo 🔍 포트 3003 (프론트엔드) 사용 중인 프로세스:
netstat -ano | findstr :3003

echo.
echo ========================================
echo ✅ QText 서비스 캐시 삭제 완료!
echo ========================================
echo.
echo 📋 다음 단계:
echo    1. QText 서비스 재시작
echo    2. 메인 API 서버 재시작 (필요시)
echo    3. 프론트엔드 재시작 (npm install 불필요)
echo.
echo 🚀 서비스 시작 명령어:
echo    # QText 서비스:
echo    cd services\qtext-service
echo    python main.py
echo.
echo    # 프론트엔드 (캐시 삭제 후 바로 실행 가능):
echo    cd frontend
echo    npm start
echo.
echo 🌐 접속 URL:
echo    - QText 서비스: http://localhost:8003
echo    - 메인 API: http://localhost:8001
echo    - 프론트엔드: http://localhost:3003
echo.

pause 
