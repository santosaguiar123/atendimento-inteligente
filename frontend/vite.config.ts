import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Configuração mínima do Vite. A porta 5173 é fixada explicitamente porque o
// docker-compose.yml e o CORS_ALLOWED_ORIGINS do backend assumem essa porta.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // necessário para o servidor aceitar conexões de fora do container
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
});
