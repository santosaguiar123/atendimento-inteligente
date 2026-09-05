/**
 * Cliente HTTP centralizado para falar com o backend.
 *
 * Toda chamada à API deve passar por este arquivo (ou por outros arquivos dentro
 * de src/services/ que usem esta instância) — evita espalhar `fetch`/URLs soltas
 * pelos componentes. Ver docs/development-guide.md, seção "Como navegar pelo
 * projeto".
 */
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api",
});

export const AUTH_TOKEN_STORAGE_KEY = "auth_token";

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (token) config.headers.set("Authorization", `Token ${token}`);
  return config;
});
