@echo off
chcp 65001 > nul
echo "Railway 배포 성공 후 한글 파일 복원"

echo "temp_korean_files에서 한글 파일들을 루트로 복원중..."
move temp_korean_files\* .\ 2>nul
rmdir temp_korean_files 2>nul

echo "한글 파일 복원 완료!"
echo "Git에 커밋하여 원상복구:"
echo ""
echo "git add ."
echo "git commit -m 'restore: korean files back after successful railway deployment'"
echo "git push origin main"

pause
