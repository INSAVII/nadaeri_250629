#!/bin/bash
# Railway/Vercel 배포를 위한 UTF-8 환경 설정 스크립트

echo "========================================="
echo "QClick UTF-8 배포 환경 설정"
echo "========================================="

# 1. 환경변수 설정
export PYTHONIOENCODING=utf-8
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

echo "✅ UTF-8 환경변수 설정 완료"

# 2. Python 스크립트 실행 시 UTF-8 강제 설정
echo "✅ Python UTF-8 인코딩 적용됨"

# 3. 파일 권한 설정 (Unix 계열)
if [ "$(uname)" != "Darwin" ] && [ "$(expr substr $(uname -s) 1 5)" != "MINGW" ]; then
    find . -name "*.py" -exec chmod +x {} \;
    echo "✅ Python 파일 실행 권한 설정 완료"
fi

# 4. Railway 배포 준비
echo "🚀 Railway 배포 준비 중..."
if command -v railway &> /dev/null; then
    echo "Railway CLI 설치됨"
else
    echo "⚠️ Railway CLI가 설치되지 않음. npm install -g @railway/cli 실행하세요."
fi

# 5. Vercel 배포 준비
echo "🚀 Vercel 배포 준비 중..."
if command -v vercel &> /dev/null; then
    echo "Vercel CLI 설치됨"
else
    echo "⚠️ Vercel CLI가 설치되지 않음. npm install -g vercel 실행하세요."
fi

echo "========================================="
echo "✅ UTF-8 배포 환경 설정 완료!"
echo "========================================="
echo ""
echo "📋 다음 단계:"
echo "1. Railway 배포: cd services/main-api && railway up"
echo "2. Vercel 배포: cd frontend && vercel --prod"
echo ""
echo "🔧 환경변수 확인:"
echo "PYTHONIOENCODING=$PYTHONIOENCODING"
echo "LANG=$LANG"
echo "LC_ALL=$LC_ALL"
