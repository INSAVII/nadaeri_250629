#!/bin/sh
echo "PORT is: $PORT"
exec gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8000} --access-logfile - --error-logfile - 