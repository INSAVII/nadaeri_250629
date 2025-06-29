@echo off
echo ========================================
echo QClick 전체 배포 스크립트
echo ========================================

echo 현재 시간: %date% %time%
echo.

echo 1. 배포 전 체크리스트 확인...
echo - [ ] 환경변수 설정 완료
echo - [ ] API 키 발급 완료
echo - [ ] 도메인 설정 완료
echo - [ ] 데이터베이스 준비 완료
echo.

echo 2. 프론트엔드 빌드...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo 프론트엔드 빌드 실패!
    pause
    exit /b 1
)
cd ..

echo.
echo 3. 백엔드 서비스 빌드...
cd services\main-api
echo 메인 API 빌드 완료
cd ..\qname-service
echo QName 서비스 빌드 완료
cd ..\qtext-service
echo QText 서비스 빌드 완료
cd ..\..

echo.
echo 4. 배포 명령어 안내...
echo.
echo === Vercel (프론트엔드) ===
echo vercel --prod
echo.
echo === Railway (메인 API) ===
echo railway up
echo.
echo === Render (마이크로서비스) ===
echo render deploy
echo.

echo 5. 환경변수 설정 안내...
echo 다음 환경변수들을 각 플랫폼에서 설정하세요:
echo.
echo DATABASE_URL=postgresql://...
echo JWT_SECRET=your_secret_key
echo GEMINI_API_KEY=your_gemini_key
echo OPENAI_API_KEY=your_openai_key
echo NAVER_CLIENT_ID=your_naver_id
echo NAVER_CLIENT_SECRET=your_naver_secret
echo.

echo 배포 준비 완료!
echo 각 플랫폼에서 위 명령어를 실행하세요.
pause 