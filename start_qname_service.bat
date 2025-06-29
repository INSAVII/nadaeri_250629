@echo off
echo ========================================
echo QName Service 시작 스크립트
echo ========================================

echo 현재 디렉토리: %CD%
echo.

echo 1. Python 환경 확인...
python --version
if %errorlevel% neq 0 (
    echo 오류: Python이 설치되지 않았습니다.
    pause
    exit /b 1
)

echo.
echo 2. QName 서비스 디렉토리로 이동...
cd services\qname-service
if %errorlevel% neq 0 (
    echo 오류: services\qname-service 디렉토리를 찾을 수 없습니다.
    pause
    exit /b 1
)

echo 현재 디렉토리: %CD%
echo.

echo 3. 필요한 패키지 확인...
python -c "import fastapi, pandas, requests" 2>nul
if %errorlevel% neq 0 (
    echo 필요한 패키지를 설치합니다...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo 패키지 설치 실패. 수동으로 설치해주세요:
        echo pip install fastapi uvicorn pandas requests python-dotenv google-generativeai
        pause
    )
)

echo.
echo 4. API 키 설정 확인...
echo.
echo 🔑 API 키 설정 방법:
echo   1. processor.py 파일을 열어서 다음 변수들을 찾으세요:
echo      DIRECT_GEMINI_API_KEY = "your_gemini_api_key_here"
echo      DIRECT_NAVER_CLIENT_ID = "your_naver_client_id_here"
echo      DIRECT_NAVER_CLIENT_SECRET = "your_naver_client_secret_here"
echo.
echo   2. "your_xxx_here" 부분을 실제 API 키로 교체하세요
echo.
echo   3. API 키 발급 사이트:
echo      - Gemini: https://makersuite.google.com/app/apikey
echo      - 네이버: https://developers.naver.com/apps/#/list
echo.
echo 자세한 설정 방법은 SIMPLE_API_SETUP.md 파일을 참고하세요.
echo.

echo 5. QName 서비스 시작...
echo 포트: 8004
echo URL: http://localhost:8004
echo.
echo 서비스를 중지하려면 Ctrl+C를 누르세요
echo.

python main.py

pause 