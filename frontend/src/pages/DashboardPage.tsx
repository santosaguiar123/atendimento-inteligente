import axios from "axios";
import { type FormEvent, useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import type { Company } from "../types";

interface CompanyFormData {
  name: string;
  description: string;
  ai_context: string;
}

const EMPTY_FORM: CompanyFormData = {
  name: "",
  description: "",
  ai_context: "",
};

function getRequestError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data as
    | { detail?: string; name?: string[] }
    | undefined;
  return data?.detail ?? data?.name?.[0] ?? fallback;
}

export function DashboardPage() {
  const { logout, user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [form, setForm] = useState<CompanyFormData>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCompanies() {
      try {
        const response = await api.get<Company[]>("/companies/", {
          signal: controller.signal,
        });
        setCompanies(response.data);

        const firstCompany = response.data[0];
        if (firstCompany) {
          setSelectedCompanyId(firstCompany.id);
          setForm({
            name: firstCompany.name,
            description: firstCompany.description,
            ai_context: firstCompany.ai_context,
          });
        }
      } catch (requestError) {
        if (!axios.isCancel(requestError)) {
          setError(getRequestError(requestError, "Não foi possível carregar as empresas."));
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadCompanies();
    return () => controller.abort();
  }, []);

  function selectCompany(id: string) {
    const company = companies.find((item) => item.id === id);
    if (!company) return;

    setSelectedCompanyId(id);
    setForm({
      name: company.name,
      description: company.description,
      ai_context: company.ai_context,
    });
    setError("");
    setSuccessMessage("");
  }

  function updateField(field: keyof CompanyFormData, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!form.name.trim()) {
      setError("O nome da empresa é obrigatório.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = { ...form, name: form.name.trim() };

      if (companies.length === 0) {
        const response = await api.post<Company>("/companies/", payload);
        setCompanies([response.data]);
        setSelectedCompanyId(response.data.id);
        setForm({
          name: response.data.name,
          description: response.data.description,
          ai_context: response.data.ai_context,
        });
        setSuccessMessage("Empresa criada com sucesso.");
      } else {
        const response = await api.patch<Company>(
          `/companies/${selectedCompanyId}/`,
          payload,
        );
        setCompanies((current) =>
          current.map((company) =>
            company.id === response.data.id ? response.data : company,
          ),
        );
        setSuccessMessage("Empresa atualizada com sucesso.");
      }
    } catch (requestError) {
      setError(getRequestError(requestError, "Não foi possível salvar a empresa."));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <main className="app-shell"><p>Carregando empresas...</p></main>;
  }

  return (
    <main className="app-shell">
      <section className="app-card content-card">
        <div className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p>{user?.email}</p>
          </div>
          <button type="button" onClick={logout}>Sair</button>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}
        {successMessage && <p role="status">{successMessage}</p>}

        {companies.length > 1 && (
          <label>
            Empresa
            <select
              value={selectedCompanyId}
              onChange={(event) => selectCompany(event.target.value)}
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </label>
        )}

        <h2>{companies.length === 0 ? "Cadastre sua empresa" : "Editar empresa"}</h2>
        <form className="data-form" onSubmit={handleSubmit}>
          <label htmlFor="company-name">Nome</label>
          <input
            id="company-name"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            required
          />

          <label htmlFor="company-description">Descrição</label>
          <textarea
            id="company-description"
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
          />

          <label htmlFor="company-context">Contexto da IA</label>
          <textarea
            id="company-context"
            value={form.ai_context}
            onChange={(event) => updateField("ai_context", event.target.value)}
            rows={8}
          />

          <button type="submit" disabled={isSaving}>
            {isSaving ? "Salvando..." : companies.length === 0 ? "Criar empresa" : "Salvar alterações"}
          </button>
        </form>

        {companies.length > 0 && (
          <p>Link público: <code>/atendimento/{companies.find((item) => item.id === selectedCompanyId)?.slug}</code></p>
        )}
      </section>
    </main>
  );
}
