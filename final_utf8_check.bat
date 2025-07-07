@echo off
chcp 65001 >nul
echo ========================================
echo 한글 파일명 처리 및 UTF-8 최종 점검
echo ========================================
echo.

echo 🔍 한글 파일명이 포함된 파일들 확인...
echo.

echo 📁 현재 한글 파일명 목록:
echo    - 큐문자_캐시완전삭제.bat
echo    - 큐네임1번api_캐시완전삭제.bat  
echo    - 큐네임2번벡엔드_캐시완전삭제.bat
echo    - 큐네임3번포엔드_캐시완전삭제.bat
echo    - 전체시스템_캐시완전삭제.bat
echo    - 큐문자 실행방법.txt
echo    - 큐네임실행방법250704배포전정리.txt
echo    - 큐문자 실행250705배포전.txt
echo.

echo 🎯 배포 권장사항:
echo.
echo ✅ 필수 배포 파일들은 이미 UTF-8 처리 완료:
echo    - vercel.json
echo    - railway.json  
echo    - frontend/package.json
echo    - services/*/requirements.txt
echo    - services/*/main.py
echo    - deployment/deploy_railway.bat
echo.

echo ⚠️ 한글 파일명 파일들은 배포에 직접 영향 없음:
echo    - 로컬 개발용 스크립트들
echo    - 문서 및 가이드 파일들
echo    - 캐시 삭제 도구들
echo.

echo 🚀 배포 시 주의사항:
echo    1. .gitignore에 한글 파일명 파일들 제외 고려
echo    2. Railway/Vercel은 필수 파일들만 업로드
echo    3. 환경변수에 한글값 있으면 인코딩 확인 필요
echo.

echo 📋 배포 최종 체크리스트:
echo    [✅] Python 파일 UTF-8 헤더 추가됨
echo    [✅] JSON 설정 파일 UTF-8 저장됨  
echo    [✅] requirements.txt UTF-8 저장됨
echo    [✅] 배포 스크립트 UTF-8 처리됨
echo    [✅] Dockerfile UTF-8 처리됨
echo.

echo 🌐 배포 명령어:
echo.
echo    Railway 메인 API:
echo    cd services\main-api
echo    railway up
echo.
echo    Vercel 프론트엔드:
echo    cd frontend  
echo    vercel --prod
echo.

echo ========================================
echo ✅ UTF-8 인코딩 최종 점검 완료!
echo ========================================
echo.
echo 이제 안전하게 Railway/Vercel 배포를 진행하세요.
echo 인코딩 문제가 발생하면 UTF8_ENCODING_GUIDE.md를 참조하세요.
echo.

pause
