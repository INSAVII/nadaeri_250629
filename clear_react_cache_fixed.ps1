# 한글 인코딩 설정
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "React Cache Clear Tool (PowerShell)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n1. Stopping Node.js processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "   Node.js processes stopped" -ForegroundColor Green

Write-Host "`n2. Stopping Python processes..." -ForegroundColor Yellow
Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "   Python processes stopped" -ForegroundColor Green

Write-Host "`n3. Cleaning frontend cache..." -ForegroundColor Yellow
Set-Location "frontend"

if (Test-Path "node_modules") {
    Write-Host "   Removing node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "   node_modules removed" -ForegroundColor Green
}

if (Test-Path ".next") {
    Write-Host "   Removing .next folder..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".next"
    Write-Host "   .next folder removed" -ForegroundColor Green
}

if (Test-Path ".cache") {
    Write-Host "   Removing .cache folder..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".cache"
    Write-Host "   .cache folder removed" -ForegroundColor Green
}

Write-Host "`n4. Cleaning backend cache..." -ForegroundColor Yellow
Set-Location "..\services\main-api"

if (Test-Path "__pycache__") {
    Write-Host "   Removing main-api __pycache__..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "__pycache__"
    Write-Host "   main-api __pycache__ removed" -ForegroundColor Green
}

Set-Location "..\qname-service"

if (Test-Path "__pycache__") {
    Write-Host "   Removing qname-service __pycache__..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "__pycache__"
    Write-Host "   qname-service __pycache__ removed" -ForegroundColor Green
}

Set-Location "..\.."

Write-Host "`n5. Cleaning temporary files..." -ForegroundColor Yellow
Remove-Item "temp_*.xlsx" -ErrorAction SilentlyContinue
Remove-Item "output_*.xlsx" -ErrorAction SilentlyContinue
Write-Host "   Temporary files cleaned" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Cache cleaning completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Clear browser cache: Ctrl+Shift+Delete" -ForegroundColor White
Write-Host "2. Hard refresh browser: Ctrl+F5" -ForegroundColor White
Write-Host "3. Restart servers:" -ForegroundColor White
Write-Host "   - Main API: cd services\main-api; python main.py" -ForegroundColor Gray
Write-Host "   - QName: cd services\qname-service; python main.py" -ForegroundColor Gray
Write-Host "   - Frontend: cd frontend; npm start" -ForegroundColor Gray

Read-Host "`nPress Enter to continue" 