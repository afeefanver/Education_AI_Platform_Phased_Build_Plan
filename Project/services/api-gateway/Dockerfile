FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt /app/requirements.txt
COPY packages/shared-models /app/packages/shared-models
COPY services/api-gateway /app/services/api-gateway

RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir -e packages/shared-models

WORKDIR /app/services/api-gateway

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
