import axios from "axios";
import { Bot, CheckCircle2, MessagesSquare, Send } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { api } from "../services/api";
import type { Conversation, Message, PublicCompany } from "../types";
import { formatDateTime } from "../utils/format";

function getRequestError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data as { detail?: string; content?: string[] } | undefined;
  return data?.detail ?? data?.content?.[0] ?? fallback;
}

// O cliente é anônimo (sem login — ver docs/database.md). A única forma de
// voltar a uma conversa depois de fechar a aba é guardando o UUID dela no
// próprio navegador. Isso não é autenticação de verdade: quem tiver esse
// link consegue ver a conversa (mesma limitação documentada em docs/api.md).
function storageKeyFor(slug: string) {
  return `resolvi:conversation:${slug}`;
}

export function PublicServicePage() {
  const { slug } = useParams<{ slug: string }>();
  const [company, setCompany] = useState<PublicCompany | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCompanyAndRestoreConversation() {
      if (!slug) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get<PublicCompany>(
          `/public/companies/${encodeURIComponent(slug)}/`,
          { signal: controller.signal },
        );
        setCompany(response.data);

        const storedId = localStorage.getItem(storageKeyFor(slug));
        if (storedId) {
          try {
            const messagesResponse = await api.get<Message[]>(
              `/conversations/${storedId}/messages/`,
              { signal: controller.signal },
            );
            setConversationId(storedId);
            setMessages(messagesResponse.data);
          } catch {
            // Conversa antiga não existe mais (ex.: banco foi resetado) —
            // limpa o link salvo e deixa a pessoa começar uma nova.
            localStorage.removeItem(storageKeyFor(slug));
          }
        }
      } catch (requestError) {
        if (axios.isCancel(requestError)) return;
        if (axios.isAxiosError(requestError) && requestError.response?.status === 404) {
          setNotFound(true);
        } else {
          setError(getRequestError(requestError, "Não foi possível carregar este canal."));
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadCompanyAndRestoreConversation();
    return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messages]);

  async function startConversation() {
    if (!slug || isStarting) return;

    setError("");
    setIsStarting(true);
    try {
      const response = await api.post<Conversation>(
        `/public/companies/${encodeURIComponent(slug)}/conversations/`,
        {},
      );
      setConversationId(response.data.id);
      localStorage.setItem(storageKeyFor(slug), response.data.id);
      const messagesResponse = await api.get<Message[]>(
        `/conversations/${response.data.id}/messages/`,
      );
      setMessages(messagesResponse.data);
    } catch (requestError) {
      setError(getRequestError(requestError, "Não foi possível iniciar a conversa."));
    } finally {
      setIsStarting(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!conversationId || isSending) return;

    const content = messageText.trim();
    if (!content) {
      setError("Digite uma mensagem antes de enviar.");
      return;
    }

    setError("");
    setIsSending(true);
    setMessageText("");
    try {
      await api.post<Message>(`/conversations/${conversationId}/messages/`, { content });
      // O POST devolve só a mensagem do cliente — buscamos a lista de novo
      // pra pegar também a resposta da IA que acabou de ser gerada.
      const messagesResponse = await api.get<Message[]>(
        `/conversations/${conversationId}/messages/`,
      );
      setMessages(messagesResponse.data);
    } catch (requestError) {
      setError(getRequestError(requestError, "Não foi possível enviar a mensagem."));
    } finally {
      setIsSending(false);
    }
  }

  if (isLoading) {
    return <div className="generic-loading">Carregando atendimento...</div>;
  }

  if (notFound) {
    return (
      <div className="generic-error-page">
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>Canal não encontrado</h1>
          <p>Confira o endereço informado ou peça um novo link à empresa.</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="generic-error-page">
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>Atendimento indisponível</h1>
          {error && <p className="form-banner error">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="public-shell">
      <div className="public-card">
        <div className="public-card-head">
          <div className="brand">
            <CheckCircle2 size={13} style={{ marginRight: 5, verticalAlign: -2 }} />
            Atendimento via Resolvi
          </div>
          <h1>{company.name}</h1>
          {company.description && <p>{company.description}</p>}
        </div>

        <div className="public-card-body">
          {error && <p className="form-banner error" role="alert">{error}</p>}

          {!conversationId ? (
            <div className="public-empty-state">
              <MessagesSquare size={28} color="var(--verde-700)" style={{ marginBottom: 10 }} />
              <p>Envie sua primeira mensagem e receba uma resposta em instantes.</p>
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={startConversation}
                disabled={isStarting}
              >
                {isStarting ? "Iniciando..." : "Iniciar conversa"}
              </button>
            </div>
          ) : (
            <>
              <div className="public-thread" ref={threadRef} aria-live="polite">
                {messages.length === 0 ? (
                  <p style={{ color: "var(--neutro-500)", fontSize: 14 }}>
                    Nenhuma mensagem ainda. Envie a primeira abaixo.
                  </p>
                ) : (
                  messages.map((message) => {
                    const isCustomer = message.sender === "CUSTOMER";
                    return (
                      <div key={message.id} className={`bubble-row ${isCustomer ? "from-me" : "from-ai"}`}>
                        <span className="bubble-avatar">{isCustomer ? "Eu" : <Bot size={14} />}</span>
                        <div>
                          {!isCustomer && (
                            <div className="bubble-tag">
                              <Bot size={12} /> Resposta automática · IA
                            </div>
                          )}
                          <div className="bubble">{message.content}</div>
                          <span className="bubble-time">{formatDateTime(message.created_at)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                {isSending && (
                  <div className="bubble-row from-ai">
                    <span className="bubble-avatar"><Bot size={14} /></span>
                    <div className="bubble">Digitando...</div>
                  </div>
                )}
              </div>

              <form onSubmit={sendMessage}>
                <div className="reply-input-row" style={{ padding: 0 }}>
                  <textarea
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    disabled={isSending}
                    rows={2}
                    placeholder="Escreva sua mensagem..."
                  />
                  <button type="submit" className="btn btn-primary" disabled={isSending}>
                    <Send size={14} /> {isSending ? "Enviando" : "Enviar"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
