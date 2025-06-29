@echo off
echo ========================================
echo QClick API Gateway 시작
echo ========================================
echo.

echo 선택하세요:
echo 1. Kong API Gateway (Docker 기반, 고급 기능)
echo 2. Simple API Gateway (Python 기반, 간단함)
echo.

set /p choice="선택 (1 또는 2): "

if "%choice%"=="1" (
    echo.
    echo 🐳 Kong API Gateway 시작 중...
    echo.
    echo Docker가 설치되어 있어야 합니다.
    echo.
    
    echo 1. Kong 컨테이너 시작...
    docker-compose up -d
    
    echo.
    echo 2. 10초 대기 후 설정 적용...
    timeout /t 10 /nobreak > nul
    
    echo 3. Kong 설정 적용...
    python setup_gateway.py
    
    echo.
    echo ========================================
    echo Kong API Gateway 설정 완료!
    echo ========================================
    echo.
    echo 📋 엔드포인트:
    echo   - API Gateway: http://localhost:8000
    echo   - Kong Admin: http://localhost:8001
    echo.
    echo 🔗 프록시된 서비스:
    echo   - 메인 API: http://localhost:8000/api/auth/*
    echo   - 큐네임: http://localhost:8000/api/qname/*
    echo   - 큐문자: http://localhost:8000/api/qtext/*
    echo.
    
) else if "%choice%"=="2" (
    echo.
    echo 🐍 Simple API Gateway 시작 중...
    echo.
    
    echo 필요한 패키지 설치 중...
    pip install httpx
    
    echo.
    echo API Gateway 시작...
    python simple_gateway.py
    
) else (
    echo.
    echo ❌ 잘못된 선택입니다.
    echo.
)

pause 