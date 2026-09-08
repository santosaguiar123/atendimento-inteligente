import axios from "axios";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

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
    <div className="auth-shell">
      <div className="auth-brand-panel">
        <div className="brand">
          <span className="brand-mark"><CheckCircle2 size={16} /></span>
          Resolvi
        </div>
        <div className="auth-quote">
          <h2>"Consigo ver todas as conversas das minhas empresas num painel só."</h2>
          <p>Depoimento ilustrativo — assim que sua empresa começar a usar o Resolvi, esse espaço é seu.</p>
        </div>
        <div className="auth-panel-stat">
          <strong>1</strong>
          painel para todas as suas empresas
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-box">
          <Link to="/" className="back-link"><ArrowLeft size={14} /> Voltar para a home</Link>
          <h1>Entrar</h1>
          <p className="sub">Acesse o painel da sua empresa.</p>

          <form onSubmit={handleSubmit} style={{ marginTop: 8 }}>
            <div className="field" style={{ marginTop: 22 }}>
              <label htmlFor="email">E-mail</label>
              <div className="field-input">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="voce@email.com"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Senha</label>
              <div className="field-input">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  required
                />
              </div>
            </div>

            {error && <p className="form-banner error" role="alert">{error}</p>}

            <button type="submit" className="btn btn-primary btn-block auth-submit" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="auth-switch">Ainda não tem conta? <Link to="/cadastro">Cadastre-se</Link></p>
        </div>
      </div>
    </div>
  );
}
