# Imagem de desenvolvimento do frontend.
# Roda o servidor de desenvolvimento do Vite dentro do Docker Compose. Um build
# de produção (servido por Nginx ou similar) é tarefa da Fase 9 do roadmap.

FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
