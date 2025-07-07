# 안전한 Git 푸시용 PowerShell 스크립트
# 한글 파일명 자동 제외 및 UTF-8 핵심 파일만 선별

Write-Host "========================================" -ForegroundColor Green
Write-Host "UTF-8 배포용 안전한 Git 푸시" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# UTF-8 코드페이지 설정
chcp 65001 | Out-Null

Write-Host "1. 현재 Git 상태 확인..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "2. 기존 staging 영역 초기화..." -ForegroundColor Yellow
git reset

Write-Host ""
Write-Host "3. UTF-8 핵심 파일들만 선별 추가..." -ForegroundColor Yellow

$coreFiles = @(
    "services/main-api/main.py",
    "services/qname-service/main.py", 
    "services/qtext-service/main.py",
    "services/main-api/requirements.txt",
    "services/qname-service/requirements.txt",
    "services/qtext-service/requirements.txt",
    "vercel.json",
    "services/main-api/railway.json",
    "frontend/package.json",
    "frontend/src/index.html",
    "DEPLOYMENT_UTF8_COMPLETE.md",
    "UTF8_RAILWAY_ENV.txt",
    "deployment/deploy_railway_utf8_fixed.bat",
    ".gitignore_utf8"
)

foreach ($file in $coreFiles) {
    if (Test-Path $file) {
        git add $file
        Write-Host "✅ 추가됨: $file" -ForegroundColor Green
    } else {
        Write-Host "⚠️ 파일 없음: $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "4. 추가된 파일들 확인..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "5. 최종 커밋 파일 목록..." -ForegroundColor Yellow
git diff --cached --name-only

Write-Host ""
$confirm = Read-Host "위 파일들을 커밋하시겠습니까? (y/n)"

if ($confirm -eq 'y' -or $confirm -eq 'Y') {
    Write-Host ""
    Write-Host "6. UTF-8 인코딩 해결 커밋..." -ForegroundColor Yellow
    git commit -m "🔧 UTF-8 인코딩 문제 해결

- Python 파일들에 UTF-8 헤더 추가 완료
- Railway/Vercel 설정 UTF-8 최적화  
- requirements.txt UTF-8 재저장
- 한글 파일명 제외 .gitignore 추가
- 배포 스크립트 UTF-8 버전 생성

Railway/Vercel 배포 준비 완료"

    Write-Host ""
    Write-Host "7. GitHub에 푸시..." -ForegroundColor Yellow
    git push origin main
    
    Write-Host ""
    Write-Host "✅ UTF-8 배포용 푸시 완료!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ 푸시가 취소되었습니다." -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "푸시 완료! 이제 Railway/Vercel 배포 가능" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
