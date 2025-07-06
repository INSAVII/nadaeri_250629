@echo off
echo ========================================
echo    나대리.kr 도메인 설정 스크립트
echo ========================================
echo.

echo 1. 도메인 구매 확인...
echo    - 나대리.kr 도메인이 구매되어 있는지 확인하세요
echo    - 도메인 등록업체: 가비아, 후이즈, 네임칩 등
echo.

echo 2. DNS 설정 확인...
echo    다음 DNS 레코드를 도메인 관리 페이지에 설정하세요:
echo.
echo    프론트엔드 (Vercel):
echo    Type: CNAME
echo    Name: www
echo    Value: cname.vercel-dns.com
echo.
echo    API 서브도메인:
echo    Type: CNAME
echo    Name: api
echo    Value: nadaeri-250629-production.up.railway.app
echo.
echo    QName 서비스:
echo    Type: CNAME
echo    Name: qname
echo    Value: qclick-qname-service.onrender.com
echo.
echo    QText 서비스:
echo    Type: CNAME
echo    Name: qtext
echo    Value: [Railway QText 서비스 URL]
echo.

echo 3. Vercel 설정...
echo    - Vercel 대시보드에서 프로젝트 선택
echo    - Settings > Domains에서 www.나대리.kr 추가
echo    - DNS 검증 완료 대기
echo.

echo 4. 환경 변수 설정...
echo    Vercel 환경 변수:
echo    REACT_APP_API_URL=https://api.나대리.kr
echo    REACT_APP_ENVIRONMENT=production
echo.
echo    Railway 환경 변수:
echo    CORS_ORIGINS=https://www.나대리.kr,https://나대리.kr
echo.

echo 5. 테스트...
echo    다음 URL들을 테스트하세요:
echo    - https://www.나대리.kr
echo    - https://api.나대리.kr/health
echo    - https://qname.나대리.kr
echo    - https://qtext.나대리.kr
echo.

echo 6. 완료 체크리스트...
echo    [ ] 도메인 구매 완료
echo    [ ] DNS 레코드 설정
echo    [ ] Vercel 도메인 연결
echo    [ ] SSL 인증서 발급 확인
echo    [ ] 환경 변수 업데이트
echo    [ ] 기능 테스트 완료
echo.

pause 