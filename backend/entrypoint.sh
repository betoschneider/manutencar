#!/bin/bash
# Aplica migrations pendentes ao subir o container
alembic upgrade head
# Inicia o servidor FastAPI
exec uvicorn app.main:app --host 0.0.0.0 --port 8090
