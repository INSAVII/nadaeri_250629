FROM python:3.11-slim

WORKDIR /app

# services/main-api 폴더의 내용을 /app으로 복사
COPY services/main-api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY services/main-api/ .

EXPOSE 8000

# Railway $PORT 환경변수를 올바르게 처리
CMD ["python", "main.py"]
