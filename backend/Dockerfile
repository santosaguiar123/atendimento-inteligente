# Imagem de desenvolvimento do backend.
# Objetivo: ambiente reproduzível para rodar o servidor de desenvolvimento do
# Django dentro do Docker Compose (ver docker-compose.yml na raiz do projeto).
# Um Dockerfile de produção (com gunicorn, sem código montado como volume, etc.)
# é tarefa da Fase 9 do roadmap — não faz parte do MVP.

FROM python:3.12-slim

# Evita a geração de arquivos .pyc e garante que os logs apareçam em tempo real
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Dependências de sistema necessárias para compilar psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
