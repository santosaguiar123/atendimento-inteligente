import axios from "axios";
import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";

import { CompanyForm, type CompanyFormValues } from "../components/dashboard/CompanyForm";
import { CompanySidebar } from "../components/dashboard/CompanySidebar";
import { ConversationList } from "../components/dashboard/ConversationList";
import { ConversationThread } from "../components/dashboard/ConversationThread";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import type { Company, ConversationSummary, Message } from "../types";

const EMPTY_COMPANY_FORM: CompanyFormValues = { name: "", description: "", ai_context: "" };

type DashboardMode = "conversas" | "editar" | "nova-empresa";

function getRequestError(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data as { detail?: string; name?: string[] } | undefined;
  return data?.detail ?? data?.name?.[0] ?? fallback;
}

export function DashboardPage() {
  const { user, logout } = useAuth();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [companiesError, setCompaniesError] = useState("");

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [mode, setMode] = useState<DashboardMode>("conversas");

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [companyFormError, setCompanyFormError] = useState("");
  const [companyFormSuccess, setCompanyFormSuccess] = useState("");

  // Carrega as empresas do usuário logado ao abrir o painel.
  useEffect(() => {
    const controller = new AbortController();

    async function loadCompanies() {
      setIsLoadingCompanies(true);
      setCompaniesError("");
      try {
        const response = await api.get<Company[]>("/companies/", { signal: controller.signal });
        setCompanies(response.data);
        if (response.data.length > 0) {
          setSelectedCompanyId(response.data[0].id);
          setMode("conversas");
        } else {
          setMode("nova-empresa");
        }
      } catch (error) {
        if (axios.isCancel(error)) return;
        setCompaniesError(getRequestError(error, "Não foi possível carregar suas empresas."));
      } finally {
        setIsLoadingCompanies(false);
      }
    }

    loadCompanies();
    return () => controller.abort();
  }, []);

  // Sempre que a empresa selecionada muda, busca as conversas dela.
  useEffect(() => {
    if (!selectedCompanyId) {
      setConversations([]);
      setSelectedConversationId(null);
      return;
    }

    const controller = new AbortController();

    async function loadConversations() {
      setIsLoadingConversations(true);
      try {
        const response = await api.get<ConversationSummary[]>(
          `/companies/${selectedCompanyId}/conversations/`,
          { signal: controller.signal },
        );
        setConversations(response.data);
        setSelectedConversationId(response.data.length > 0 ? response.data[0].id : null);
      } catch (error) {
        if (axios.isCancel(error)) return;
        setConversations([]);
        setSelectedConversationId(null);
      } finally {
        setIsLoadingConversations(false);
      }
    }

    loadConversations();
    return () => controller.abort();
  }, [selectedCompanyId]);

  // Sempre que a conversa selecionada muda, busca as mensagens dela.
  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    const controller = new AbortController();

    async function loadMessages() {
      setIsLoadingMessages(true);
      setStatusError("");
      try {
        const response = await api.get<Message[]>(
          `/conversations/${selectedConversationId}/messages/`,
          { signal: controller.signal },
        );
        setMessages(response.data);
      } catch (error) {
        if (axios.isCancel(error)) return;
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    }

    loadMessages();
    return () => controller.abort();
  }, [selectedConversationId]);

  function handleSelectCompany(id: string) {
    setSelectedCompanyId(id);
    setMode("conversas");
    setCompanyFormError("");
    setCompanyFormSuccess("");
  }

  function handleNewCompanyClick() {
    setMode("nova-empresa");
    setCompanyFormError("");
    setCompanyFormSuccess("");
  }

  function handleEditCompanyClick() {
    setMode("editar");
    setCompanyFormError("");
    setCompanyFormSuccess("");
  }

  async function handleCreateCompany(values: CompanyFormValues) {
    setIsSavingCompany(true);
    setCompanyFormError("");
    try {
      const response = await api.post<Company>("/companies/", values);
      setCompanies((current) => [response.data, ...current]);
      setSelectedCompanyId(response.data.id);
      setMode("conversas");
    } catch (error) {
      setCompanyFormError(getRequestError(error, "Não foi possível criar a empresa."));
    } finally {
      setIsSavingCompany(false);
    }
  }

  async function handleUpdateCompany(values: CompanyFormValues) {
    if (!selectedCompanyId) return;
    setIsSavingCompany(true);
    setCompanyFormError("");
    setCompanyFormSuccess("");
    try {
      const response = await api.patch<Company>(`/companies/${selectedCompanyId}/`, values);
      setCompanies((current) => current.map((c) => (c.id === response.data.id ? response.data : c)));
      setCompanyFormSuccess("Empresa atualizada com sucesso.");
    } catch (error) {
      setCompanyFormError(getRequestError(error, "Não foi possível salvar a empresa."));
    } finally {
      setIsSavingCompany(false);
    }
  }

  async function handleToggleStatus() {
    const conversation = conversations.find((c) => c.id === selectedConversationId);
    if (!conversation) return;

    const newStatus = conversation.status === "OPEN" ? "CLOSED" : "OPEN";
    setIsTogglingStatus(true);
    setStatusError("");
    try {
      await api.patch(`/conversations/${conversation.id}/status/`, { status: newStatus });
      setConversations((current) =>
        current.map((c) => (c.id === conversation.id ? { ...c, status: newStatus } : c)),
      );
    } catch (error) {
      setStatusError(getRequestError(error, "Não foi possível atualizar o status da conversa."));
    } finally {
      setIsTogglingStatus(false);
    }
  }

  if (isLoadingCompanies) {
    return <div className="generic-loading">Carregando seu painel...</div>;
  }

  if (companiesError) {
    return <div className="generic-error-page">{companiesError}</div>;
  }

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) ?? null;
  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) ?? null;
  const userLabel = user?.full_name || user?.email || "Sua conta";

  return (
    <div className="dash-shell">
      <CompanySidebar
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        onSelectCompany={handleSelectCompany}
        onNewCompany={handleNewCompanyClick}
        isNewCompanyActive={mode === "nova-empresa"}
        userLabel={userLabel}
        onLogout={logout}
      />

      <div className="dash-main">
        {mode === "nova-empresa" ? (
          <>
            <div className="dash-topbar">
              <div>
                <h1>Cadastrar empresa</h1>
                <div className="sub">Preencha os dados para começar a receber mensagens.</div>
              </div>
            </div>
            <div className="dash-empty">
              <div className="dash-empty-card">
                <CompanyForm
                  key="new"
                  initial={EMPTY_COMPANY_FORM}
                  isSaving={isSavingCompany}
                  error={companyFormError}
                  successMessage=""
                  submitLabel="Criar empresa"
                  onSubmit={handleCreateCompany}
                  onCancel={companies.length > 0 ? () => setMode("conversas") : undefined}
                />
              </div>
            </div>
          </>
        ) : mode === "editar" && selectedCompany ? (
          <>
            <div className="dash-topbar">
              <div>
                <h1>{selectedCompany.name}</h1>
                <div className="sub">Editar dados da empresa</div>
              </div>
            </div>
            <div className="dash-empty">
              <div className="dash-empty-card">
                <CompanyForm
                  key={selectedCompany.id}
                  initial={{
                    name: selectedCompany.name,
                    description: selectedCompany.description,
                    ai_context: selectedCompany.ai_context,
                  }}
                  publicSlug={selectedCompany.slug}
                  isSaving={isSavingCompany}
                  error={companyFormError}
                  successMessage={companyFormSuccess}
                  submitLabel="Salvar alterações"
                  onSubmit={handleUpdateCompany}
                  onCancel={() => setMode("conversas")}
                />
              </div>
            </div>
          </>
        ) : selectedCompany ? (
          <>
            <div className="dash-topbar">
              <div>
                <h1>{selectedCompany.name}</h1>
                <div className="sub">Mensagens recebidas</div>
              </div>
              <div className="dash-topbar-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={handleEditCompanyClick}>
                  <Pencil size={14} /> Editar empresa
                </button>
              </div>
            </div>
            <div className="dash-body">
              <ConversationList
                conversations={conversations}
                selectedConversationId={selectedConversationId}
                onSelect={setSelectedConversationId}
                isLoading={isLoadingConversations}
              />
              <ConversationThread
                conversation={selectedConversation}
                messages={messages}
                isLoadingMessages={isLoadingMessages}
                onToggleStatus={handleToggleStatus}
                isTogglingStatus={isTogglingStatus}
                statusError={statusError}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
