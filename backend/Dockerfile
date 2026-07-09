FROM python:3.12-slim

# Instala o uv (gerenciador de pacotes ultra-rápido)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Copia apenas requirements primeiro (cache layer otimizado)
COPY requirements.txt .
RUN uv pip install --system -r requirements.txt

# Copia o código do backend e config do Alembic
COPY app/ ./app/
COPY alembic.ini .
COPY alembic/ ./alembic/
COPY entrypoint.sh .

EXPOSE 8090

CMD ["bash", "entrypoint.sh"]
