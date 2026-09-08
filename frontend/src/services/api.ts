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
export const AUTH_USER_STORAGE_KEY = "auth_user";

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (token) config.headers.set("Authorization", `Token ${token}`);
  return config;
});

// Se o token guardado deixou de ser válido (expirou, foi revogado, etc.), o
// backend responde 401 em qualquer endpoint autenticado. Em vez de deixar a
// tela travada num estado de erro, limpamos a sessão e mandamos a pessoa de
// volta para o login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== "/login") {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
