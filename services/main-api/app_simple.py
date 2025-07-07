# -*- coding: utf-8 -*-
"""
Railway 배포 테스트용 초간단 FastAPI 앱
이 파일이 정상 작동하면 Railway 설정 문제가 아님을 확인할 수 있습니다.
"""
from fastapi import FastAPI
import uvicorn
import os
import datetime

app = FastAPI(title="Railway 테스트용 초간단 앱")

@app.get("/")
async def root():
    return {
        "message": "🎉 Railway FastAPI 배포 성공! 🎉",
        "app": "초간단 테스트 앱",
        "timestamp": datetime.datetime.now().isoformat(),
        "port": os.getenv("PORT", "unknown"),
        "status": "WORKING"
    }

@app.get("/test")
async def test():
    return {
        "test": "성공",
        "railway": "정상 작동",
        "time": datetime.datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    return {"status": "ok", "message": "정상 작동"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"🚀 초간단 앱 시작: {host}:{port}")
    uvicorn.run("app_simple:app", host=host, port=port, reload=False)
