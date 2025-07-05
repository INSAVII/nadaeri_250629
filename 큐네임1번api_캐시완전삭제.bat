@echo off
chcp 65001 >nul
REM === 큐네임1번api 캐시/임시파일 완전 삭제 ===
cd /d %~dp0
cd services\qname-service

REM __pycache__ 폴더 삭제
if exist __pycache__ rmdir /s /q __pycache__

REM *.pyc 파일 삭제
del /s /q *.pyc

REM 가공완료_*.xlsx 결과파일 삭제
del /q 가공완료_*.xlsx

echo [완료] 큐네임1번api 캐시/임시파일 삭제가 끝났습니다.
pause 