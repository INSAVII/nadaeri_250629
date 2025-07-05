@echo off
chcp 65001 >nul
REM === 큐네임3번포엔드 캐시/임시파일 완전 삭제 ===
cd /d %~dp0
cd frontend

REM node_modules 폴더 삭제
if exist node_modules rmdir /s /q node_modules

REM .parcel-cache 폴더 삭제
if exist .parcel-cache rmdir /s /q .parcel-cache

REM dist 폴더 삭제
if exist dist rmdir /s /q dist

REM package-lock.json 삭제
if exist package-lock.json del /q package-lock.json

echo [완료] 큐네임3번포엔드 캐시/임시파일 삭제가 끝났습니다.
pause 