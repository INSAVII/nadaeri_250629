FROM python:3.11-slim

WORKDIR /app

# services/main-api 폴더의 내용을 /app으로 복사
COPY services/main-api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY services/main-api/ .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
