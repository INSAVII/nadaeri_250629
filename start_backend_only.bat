@echo off
echo Starting backend server on port 8001...
cd /d D:\250624_cms01\services\main-api
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
pause
