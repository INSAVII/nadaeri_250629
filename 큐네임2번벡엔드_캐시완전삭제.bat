@echo off
chcp 65001 >nul
REM === 큐네임2번벡엔드 캐시/임시파일 완전 삭제 ===
cd /d %~dp0
cd services\main-api

REM __pycache__ 폴더 삭제
if exist __pycache__ rmdir /s /q __pycache__

REM logs 폴더 삭제
if exist logs rmdir /s /q logs

REM *.pyc 파일 삭제
del /s /q *.pyc

echo [완료] 큐네임2번벡엔드 캐시/임시파일 삭제가 끝났습니다.
pause 