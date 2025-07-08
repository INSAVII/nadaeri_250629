# -*- coding: utf-8 -*-
print("=== Railway 테스트 시작 ===")

import os
print(f"PORT 환경변수: {os.getenv('PORT', '없음')}")

try:
    from fastapi import FastAPI
    print("✅ FastAPI 임포트 성공")
except Exception as e:
    print(f"❌ FastAPI 임포트 실패: {e}")

try:
    import uvicorn
    print("✅ uvicorn 임포트 성공")
except Exception as e:
    print(f"❌ uvicorn 임포트 실패: {e}")

# 매우 간단한 FastAPI 앱
app = FastAPI()

@app.get("/")
async def root():
    return {"message": "테스트 성공", "status": "ok"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    try:
        port = int(os.getenv("PORT", 8000))
        print(f"✅ 포트 변환 성공: {port}")
    except Exception as e:
        print(f"❌ 포트 변환 실패: {e}")
        port = 8000
    
    print(f"=== 서버 시작 시도: 0.0.0.0:{port} ===")
    
    try:
        uvicorn.run(app, host="0.0.0.0", port=port)
    except Exception as e:
        print(f"❌ 서버 시작 실패: {e}")
        raise
