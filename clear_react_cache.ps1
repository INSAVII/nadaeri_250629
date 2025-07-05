Write-Host "========================================" -ForegroundColor Cyan
Write-Host "React 캐시 정리 도구 (PowerShell)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n1. Node.js 프로세스 종료..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "   Node.js 프로세스 종료 완료" -ForegroundColor Green

Write-Host "`n2. Python 프로세스 종료..." -ForegroundColor Yellow
Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "   Python 프로세스 종료 완료" -ForegroundColor Green

Write-Host "`n3. 프론트엔드 캐시 정리..." -ForegroundColor Yellow
Set-Location "frontend"

if (Test-Path "node_modules") {
    Write-Host "   node_modules 삭제 중..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "   node_modules 삭제 완료" -ForegroundColor Green
}

if (Test-Path ".next") {
    Write-Host "   .next 폴더 삭제 중..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".next"
    Write-Host "   .next 폴더 삭제 완료" -ForegroundColor Green
}

if (Test-Path ".cache") {
    Write-Host "   .cache 폴더 삭제 중..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".cache"
    Write-Host "   .cache 폴더 삭제 완료" -ForegroundColor Green
}

Write-Host "`n4. 백엔드 캐시 정리..." -ForegroundColor Yellow
Set-Location "..\services\main-api"

if (Test-Path "__pycache__") {
    Write-Host "   main-api __pycache__ 삭제 중..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "__pycache__"
    Write-Host "   main-api __pycache__ 삭제 완료" -ForegroundColor Green
}

Set-Location "..\qname-service"

if (Test-Path "__pycache__") {
    Write-Host "   qname-service __pycache__ 삭제 중..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "__pycache__"
    Write-Host "   qname-service __pycache__ 삭제 완료" -ForegroundColor Green
}

Set-Location "..\.."

Write-Host "`n5. 임시 파일 정리..." -ForegroundColor Yellow
Remove-Item "temp_*.xlsx" -ErrorAction SilentlyContinue
Remove-Item "output_*.xlsx" -ErrorAction SilentlyContinue
Write-Host "   임시 파일 정리 완료" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "캐시 정리 완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n다음 단계:" -ForegroundColor Yellow
Write-Host "1. 브라우저에서 Ctrl+Shift+Delete로 캐시 삭제" -ForegroundColor White
Write-Host "2. 브라우저에서 Ctrl+F5로 강제 새로고침" -ForegroundColor White
Write-Host "3. 서버 재시작:" -ForegroundColor White
Write-Host "   - 메인 API: cd services\main-api; python main.py" -ForegroundColor Gray
Write-Host "   - QName: cd services\qname-service; python main.py" -ForegroundColor Gray
Write-Host "   - 프론트엔드: cd frontend; npm start" -ForegroundColor Gray

Read-Host "`n계속하려면 Enter를 누르세요" 