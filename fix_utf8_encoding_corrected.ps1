# UTF-8 인코딩 문제 해결 스크립트
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

Write-Host "===============================================" -ForegroundColor Green
Write-Host "QClick 프로젝트 UTF-8 인코딩 수정 스크립트" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""

# 1. Python 파일들에 UTF-8 인코딩 헤더 추가
Write-Host "1. Python 파일들 UTF-8 인코딩 헤더 추가..." -ForegroundColor Yellow

$pythonFiles = @(
    "services\qname-service\main.py",
    "services\qname-service\processor.py",
    "services\qtext-service\main.py", 
    "services\qtext-service\imageprocessor.py",
    "services\main-api\main.py"
)

foreach ($file in $pythonFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding UTF8
        if ($content -notmatch "^# -\*- coding: utf-8 -\*-") {
            $newContent = "# -*- coding: utf-8 -*-`n" + $content
            $newContent | Out-File $file -Encoding UTF8 -NoNewline
            Write-Host "✅ $file - UTF-8 헤더 추가됨" -ForegroundColor Green
        } else {
            Write-Host "ℹ️ $file - 이미 UTF-8 헤더 존재" -ForegroundColor Cyan
        }
    }
}

# 2. 배치 파일들에 UTF-8 코드페이지 설정 추가
Write-Host "`n2. 배치 파일들 UTF-8 코드페이지 설정..." -ForegroundColor Yellow

$batFiles = Get-ChildItem -Path "." -Filter "*.bat" -Recurse | Where-Object { $_.Name -notlike "*_utf8*" }

foreach ($batFile in $batFiles) {
    try {
        $content = Get-Content $batFile.FullName -Encoding Default
        if ($content[0] -eq "@echo off") {
            $newContent = @()
            $newContent += "@echo off"
            $newContent += "chcp 65001 >nul"
            $newContent += $content[1..($content.Length-1)]
            
            $outputFile = $batFile.FullName -replace "\.bat$", "_utf8.bat"
            $newContent | Out-File $outputFile -Encoding UTF8
            Write-Host "✅ $($batFile.Name) -> $([System.IO.Path]::GetFileName($outputFile))" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️ $($batFile.Name) - 처리 중 오류 발생" -ForegroundColor Yellow
    }
}

# 3. JSON 파일들 UTF-8로 재저장
Write-Host "`n3. JSON 파일들 UTF-8 재저장..." -ForegroundColor Yellow

$jsonFiles = @(
    "vercel.json",
    "railway.json",
    "frontend\package.json"
)

foreach ($file in $jsonFiles) {
    if (Test-Path $file) {
        try {
            $content = Get-Content $file -Raw -Encoding UTF8
            $content | Out-File $file -Encoding UTF8 -NoNewline
            Write-Host "✅ $file - UTF-8로 재저장됨" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ $file - 처리 중 오류 발생" -ForegroundColor Yellow
        }
    }
}

# 4. requirements.txt 파일들 UTF-8로 재저장
Write-Host "`n4. requirements.txt 파일들 UTF-8 재저장..." -ForegroundColor Yellow

$reqFiles = Get-ChildItem -Path "services" -Name "requirements.txt" -Recurse

foreach ($file in $reqFiles) {
    $fullPath = "services\$file"
    if (Test-Path $fullPath) {
        try {
            $content = Get-Content $fullPath -Raw -Encoding UTF8
            $content | Out-File $fullPath -Encoding UTF8 -NoNewline
            Write-Host "✅ $fullPath - UTF-8로 재저장됨" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ $fullPath - 처리 중 오류 발생" -ForegroundColor Yellow
        }
    }
}

# 5. 배포용 UTF-8 환경 설정 파일 생성
Write-Host "`n5. 배포용 UTF-8 환경 설정 파일 생성..." -ForegroundColor Yellow

# Railway 배포용 환경변수 설정
$railwayEnvContent = @"
# Railway 환경변수에 추가할 UTF-8 설정
LANG=C.UTF-8
LC_ALL=C.UTF-8
PYTHONIOENCODING=utf-8
PYTHONUNBUFFERED=1
"@

$railwayEnvContent | Out-File "UTF8_RAILWAY_ENV.txt" -Encoding UTF8
Write-Host "✅ Railway UTF-8 환경설정 파일 생성됨" -ForegroundColor Green

# Vercel 배포용 설정
$vercelEnvContent = @"
# Vercel 환경변수에 추가할 UTF-8 설정
LANG=C.UTF-8
LC_ALL=C.UTF-8
NODE_OPTIONS=--max-old-space-size=4096
"@

$vercelEnvContent | Out-File "UTF8_VERCEL_ENV.txt" -Encoding UTF8
Write-Host "✅ Vercel UTF-8 환경설정 파일 생성됨" -ForegroundColor Green

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "✅ UTF-8 인코딩 수정 완료!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 다음 단계:" -ForegroundColor Yellow
Write-Host "1. 생성된 *_utf8.bat 파일들을 사용하세요" -ForegroundColor White
Write-Host "2. Railway/Vercel 배포 시 UTF8_*.txt 파일 내용을 참고하세요" -ForegroundColor White
Write-Host "3. Python 파일들은 자동으로 UTF-8 헤더가 추가되었습니다" -ForegroundColor White
Write-Host "4. JSON/requirements.txt 파일들이 UTF-8로 재저장되었습니다" -ForegroundColor White
Write-Host ""
