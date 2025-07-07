@echo off
chcp 65001 > nul
echo "한글 파일 임시 이동 - Railway 빌드 성공을 위해"

mkdir temp_korean_files 2>nul

echo "한글 파일들을 temp_korean_files 폴더로 이동중..."
move "250707*" temp_korean_files\ 2>nul
move "*레일웨이*" temp_korean_files\ 2>nul
move "빠른해결가이드.md" temp_korean_files\ 2>nul
move "실행방법250624.txt" temp_korean_files\ 2>nul
move "전체시스템_*" temp_korean_files\ 2>nul
move "큐네임*" temp_korean_files\ 2>nul
move "큐문자*" temp_korean_files\ 2>nul

echo "한글 파일 이동 완료!"
echo "Git에 커밋하여 Railway에서 한글 파일 제거:"
echo ""
echo "git add ."
echo "git commit -m 'temp: move korean files for railway build'"
echo "git push origin main"
echo ""
echo "배포 성공 후 복원:"
echo "git add ."
echo "git commit -m 'restore: korean files back'"
echo "git push origin main"

pause
