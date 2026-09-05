import axios from "axios";
import { type FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

interface LoginResponse {
  token: string;
}

interface LoginErrorResponse {
  detail?: string;
}

interface LoginLocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (token) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await api.post<LoginResponse>("/auth/login/", { email, password });
      login(response.data.token, { email });

      const state = location.state as LoginLocationState | null;
      navigate(state?.from?.pathname ?? "/dashboard", { replace: true });
    } catch (requestError) {
      if (axios.isAxiosError<LoginErrorResponse>(requestError)) {
        setError(
          requestError.response?.data.detail ??
            "Não foi possível entrar. Verifique suas credenciais.",
        );
      } else {
        setError("Não foi possível entrar. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="app-card" aria-labelledby="login-title">
        <h1 id="login-title">Entrar</h1>
        <p>Acesse o painel do Atendimento Inteligente.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <p className="form-error" role="alert">{error}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
