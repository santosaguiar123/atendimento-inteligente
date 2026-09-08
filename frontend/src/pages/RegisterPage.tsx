import axios from "axios";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import type { User } from "../types";

interface RegisterErrorResponse {
  detail?: string;
  email?: string[];
  full_name?: string[];
  password?: string[];
}

interface LoginResponse {
  token: string;
}

function getRegisterError(error: unknown): string {
  if (!axios.isAxiosError<RegisterErrorResponse>(error)) {
    return "Não foi possível criar a conta. Tente novamente.";
  }

  const data = error.response?.data;
  return (
    data?.detail ??
    data?.email?.[0] ??
    data?.password?.[0] ??
    data?.full_name?.[0] ??
    "Não foi possível criar a conta. Tente novamente."
  );
}

export function RegisterPage() {
  const { login, token } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (token) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não são iguais.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post<User>("/auth/register/", {
        email,
        full_name: fullName.trim(),
        password,
      });

      // A conta foi criada, mas o backend não devolve token no cadastro — por
      // isso fazemos login automaticamente com as mesmas credenciais, em vez
      // de mandar a pessoa pra tela de login de novo.
      const loginResponse = await api.post<LoginResponse>("/auth/login/", {
        email,
        password,
      });
      login(loginResponse.data.token, { email, full_name: fullName.trim() });
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(getRegisterError(requestError));
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
          <h2>"Em dois dias já tínhamos zerado a fila de mensagens em aberto."</h2>
          <p>Depoimento ilustrativo — assim que sua empresa começar a usar o Resolvi, esse espaço é seu.</p>
        </div>
        <div className="auth-panel-stat">
          <strong>24h</strong>
          a IA responde a qualquer hora do dia
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-box">
          <Link to="/" className="back-link"><ArrowLeft size={14} /> Voltar para a home</Link>
          <h1>Criar conta</h1>
          <p className="sub">Leva menos de um minuto.</p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="fullName">Nome completo</label>
              <div className="field-input">
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  placeholder="Como você quer ser chamado"
                  required
                />
              </div>
            </div>

            <div className="field">
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
                  autoComplete="new-password"
                  placeholder="Mínimo de 8 caracteres"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="confirmPassword">Confirmar senha</label>
              <div className="field-input">
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Repita a senha"
                  required
                />
              </div>
              <p className="field-hint">As duas senhas precisam ser idênticas.</p>
            </div>

            {error && <p className="form-banner error" role="alert">{error}</p>}

            <button type="submit" className="btn btn-primary btn-block auth-submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <p className="auth-switch">Já tem conta? <Link to="/login">Entrar</Link></p>
        </div>
      </div>
    </div>
  );
}
