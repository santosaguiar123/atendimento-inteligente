# Desenvolvimento: Vite com atualizacao automatica.
# Producao: Dockerfile.prod compila os arquivos e os serve pelo Nginx.

FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
