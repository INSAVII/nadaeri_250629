@echo off
echo Starting servers...

:: Start backend server
echo Starting backend server...
start cmd /k "cd /d D:\250624_cms01\backend && python run.py"

:: Wait for backend to initialize
timeout /t 3 /nobreak

:: Start frontend server
echo Starting frontend server...
start cmd /k "cd /d D:\250624_cms01\frontend && npm run dev"

echo Servers started!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3003
pause
