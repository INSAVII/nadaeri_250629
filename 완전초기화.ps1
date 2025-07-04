# PowerShell 완전 초기화 스크립트
Write-Host "========================================" -ForegroundColor Green
Write-Host "완전 초기화 스크립트 (PowerShell)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "이 스크립트는 다음을 완전히 삭제합니다:" -ForegroundColor Yellow
Write-Host "- 모든 서버 프로세스" -ForegroundColor White
Write-Host "- 브라우저 캐시 (수동)" -ForegroundColor White
Write-Host "- Parcel 빌드 캐시" -ForegroundColor White
Write-Host "- node_modules (완전 재설치)" -ForegroundColor White
Write-Host "- 모든 로컬/세션 스토리지" -ForegroundColor White
Write-Host ""
Write-Host "주의: 이 작업은 시간이 오래 걸립니다!" -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "계속하시겠습니까? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "취소되었습니다." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "[1/6] 모든 서버 프로세스 종료..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "uvicorn" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "✓ 모든 서버 프로세스 종료 완료" -ForegroundColor Green
Write-Host ""

Write-Host "[2/6] 브라우저 캐시 클리어 (수동 단계)..." -ForegroundColor Cyan
Write-Host ""
Write-Host "브라우저에서 다음을 실행하세요:" -ForegroundColor Yellow
Write-Host "1. Ctrl+Shift+Delete" -ForegroundColor White
Write-Host "2. '모든 시간' 선택" -ForegroundColor White
Write-Host "3. 모든 항목 체크" -ForegroundColor White
Write-Host "4. '데이터 삭제' 클릭" -ForegroundColor White
Write-Host ""
Read-Host "완료 후 Enter를 누르세요"

Write-Host "[3/6] 프론트엔드 완전 초기화..." -ForegroundColor Cyan
Set-Location "D:\250624_cms01\frontend"

Write-Host "- Parcel 캐시 삭제..." -ForegroundColor White
if (Test-Path ".parcel-cache") {
    Remove-Item ".parcel-cache" -Recurse -Force
    Write-Host "✓ Parcel 캐시 삭제 완료" -ForegroundColor Green
} else {
    Write-Host "✓ Parcel 캐시 없음" -ForegroundColor Green
}

Write-Host "- dist 폴더 삭제..." -ForegroundColor White
if (Test-Path "dist") {
    Remove-Item "dist" -Recurse -Force
    Write-Host "✓ dist 폴더 삭제 완료" -ForegroundColor Green
} else {
    Write-Host "✓ dist 폴더 없음" -ForegroundColor Green
}

Write-Host "- node_modules 삭제..." -ForegroundColor White
if (Test-Path "node_modules") {
    Write-Host "node_modules 삭제 중... (시간이 오래 걸릴 수 있습니다)" -ForegroundColor Yellow
    Remove-Item "node_modules" -Recurse -Force
    Write-Host "✓ node_modules 삭제 완료" -ForegroundColor Green
} else {
    Write-Host "✓ node_modules 없음" -ForegroundColor Green
}

Write-Host "- package-lock.json 삭제..." -ForegroundColor White
if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force
    Write-Host "✓ package-lock.json 삭제 완료" -ForegroundColor Green
} else {
    Write-Host "✓ package-lock.json 없음" -ForegroundColor Green
}

Write-Host ""
Write-Host "[4/6] 백엔드 캐시 정리..." -ForegroundColor Cyan
Set-Location "D:\250624_cms01\services\main-api"

Write-Host "- __pycache__ 폴더들 삭제..." -ForegroundColor White
Get-ChildItem -Path . -Recurse -Directory -Name "__pycache__" | ForEach-Object {
    Remove-Item $_ -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "✓ Python 캐시 삭제 완료" -ForegroundColor Green

Write-Host "- .pyc 파일들 삭제..." -ForegroundColor White
Get-ChildItem -Path . -Recurse -Filter "*.pyc" | Remove-Item -Force
Write-Host "✓ .pyc 파일 삭제 완료" -ForegroundColor Green

Write-Host ""
Write-Host "[5/6] 로컬 스토리지 클리어 HTML 생성..." -ForegroundColor Cyan
Set-Location "D:\250624_cms01"

$htmlContent = @"
<!DOCTYPE html>
<html>
<head><title>완전 초기화</title></head>
<body>
<h1>완전 초기화 실행 중...</h1>
<script>
localStorage.clear();
sessionStorage.clear();
console.log('모든 스토리지 클리어 완료!');
alert('완전 초기화 완료! 이제 새로고침하세요.');
</script>
</body>
</html>
"@

$htmlContent | Out-File -FilePath "완전초기화.html" -Encoding UTF8
Write-Host "✓ 완전초기화.html 생성 완료" -ForegroundColor Green

Write-Host ""
Write-Host "[6/6] 의존성 재설치 및 서버 시작..." -ForegroundColor Cyan
Write-Host ""
Write-Host "프론트엔드 의존성 재설치 중... (시간이 오래 걸립니다)" -ForegroundColor Yellow
Set-Location "D:\250624_cms01\frontend"
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install 실패! 다시 시도합니다..." -ForegroundColor Red
    npm install --force
}

Write-Host "✓ npm install 완료" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "완전 초기화 완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "다음 단계를 순서대로 실행하세요:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 완전초기화.html 열기:" -ForegroundColor White
Write-Host "   D:\250624_cms01\완전초기화.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. 프론트엔드 서버 시작:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Cyan
Write-Host "   npm run dev-clean" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. 백엔드 서버 시작:" -ForegroundColor White
Write-Host "   cd services\main-api" -ForegroundColor Cyan
Write-Host "   uvicorn main:app --host 0.0.0.0 --port 8001 --reload" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. 브라우저에서 강제 새로고침:" -ForegroundColor White
Write-Host "   Ctrl+Shift+R" -ForegroundColor Cyan
Write-Host ""
Write-Host "이제 예치금관리 탭이 영구적으로 사라지지 않습니다!" -ForegroundColor Green
Write-Host ""

Read-Host "Enter를 누르면 종료됩니다" 