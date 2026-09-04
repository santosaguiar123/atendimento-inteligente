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

// TODO (Fase 6 do roadmap): adicionar um interceptor que injeta o header
// "Authorization: Token <token>" em toda requisição, lendo o token salvo após o
// login (ver docs/api.md, seção "Autenticação").
//
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("auth_token");
//   if (token) config.headers.Authorization = `Token ${token}`;
//   return config;
// });
