# UTF-8 자동 변환 스크립트
# 사용법: .\force_utf8_encoding.ps1

Write-Host "🔧 UTF-8 강제 인코딩 적용 중..." -ForegroundColor Yellow

# 변환할 파일 확장자 정의
$extensions = @("*.js", "*.jsx", "*.ts", "*.tsx", "*.json", "*.html", "*.css", "*.md", "*.py", "*.txt", "*.toml", "*.yml", "*.yaml")

# 제외할 디렉토리
$excludeDirs = @("node_modules", ".git", "dist", "build", ".parcel-cache", "__pycache__", "venv")

# 프로젝트 루트 디렉토리
$projectRoot = "d:\250624_cms01"

function Convert-ToUTF8 {
    param(
        [string]$filePath
    )
    
    try {
        # 파일 인코딩 감지
        $content = Get-Content -Path $filePath -Raw -Encoding Default
        
        # UTF-8 BOM 없이 저장
        [System.IO.File]::WriteAllText($filePath, $content, [System.Text.UTF8Encoding]::new($false))
        
        Write-Host "✅ 변환 완료: $filePath" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ 변환 실패: $filePath - $_" -ForegroundColor Red
        return $false
    }
}

# 파일 검색 및 변환
$convertedCount = 0
$totalFiles = 0

foreach ($extension in $extensions) {
    $files = Get-ChildItem -Path $projectRoot -Filter $extension -Recurse | Where-Object {
        $exclude = $false
        foreach ($excludeDir in $excludeDirs) {
            if ($_.FullName -like "*\$excludeDir\*") {
                $exclude = $true
                break
            }
        }
        return -not $exclude
    }
    
    foreach ($file in $files) {
        $totalFiles++
        if (Convert-ToUTF8 -filePath $file.FullName) {
            $convertedCount++
        }
    }
}

Write-Host ""
Write-Host "🎉 UTF-8 변환 완료!" -ForegroundColor Cyan
Write-Host "   총 파일 수: $totalFiles" -ForegroundColor White
Write-Host "   변환된 파일: $convertedCount" -ForegroundColor White

# Git 커밋 메시지 생성
if ($convertedCount -gt 0) {
    Write-Host ""
    Write-Host "📝 Git 커밋 명령어:" -ForegroundColor Yellow
    Write-Host "git add ." -ForegroundColor Gray
    Write-Host "git commit -m 'chore: UTF-8 인코딩 적용 ($convertedCount files)'" -ForegroundColor Gray
}
