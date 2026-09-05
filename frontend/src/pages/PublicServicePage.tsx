import axios from "axios";
import { type FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { api } from "../services/api";
import type { Conversation, Message, PublicCompany } from "../types";

function getRequestError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data as
    | { detail?: string; content?: string[] }
    | undefined;
  return data?.detail ?? data?.content?.[0] ?? fallback;
}

export function PublicServicePage() {
  const { slug } = useParams<{ slug: string }>();
  const [company, setCompany] = useState<PublicCompany | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCompany() {
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

    void loadCompany();
    return () => controller.abort();
  }, [slug]);

  async function loadMessages(conversationId: string) {
    const response = await api.get<Message[]>(
      `/conversations/${conversationId}/messages/`,
    );
    setMessages(response.data);
  }

  async function startConversation() {
    if (!slug || isStarting) return;

    setError("");
    setIsStarting(true);
    try {
      const response = await api.post<Conversation>(
        `/public/companies/${encodeURIComponent(slug)}/conversations/`,
        {},
      );
      setConversation(response.data);
      await loadMessages(response.data.id);
    } catch (requestError) {
      setError(getRequestError(requestError, "Não foi possível iniciar a conversa."));
    } finally {
      setIsStarting(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!conversation || isSending) return;

    const content = messageText.trim();
    if (!content) {
      setError("Digite uma mensagem antes de enviar.");
      return;
    }

    setError("");
    setIsSending(true);
    try {
      const response = await api.post<Message>(
        `/conversations/${conversation.id}/messages/`,
        { content },
      );
      setMessages((current) => [...current, response.data]);
      setMessageText("");
      await loadMessages(conversation.id);
    } catch (requestError) {
      setError(getRequestError(requestError, "Não foi possível enviar a mensagem."));
    } finally {
      setIsSending(false);
    }
  }

  if (isLoading) {
    return <main className="app-shell"><p>Carregando atendimento...</p></main>;
  }

  if (notFound) {
    return (
      <main className="app-shell">
        <section className="app-card">
          <h1>Canal não encontrado</h1>
          <p>Confira o endereço informado ou solicite um novo link à empresa.</p>
        </section>
      </main>
    );
  }

  if (!company) {
    return (
      <main className="app-shell">
        <section className="app-card">
          <h1>Atendimento indisponível</h1>
          {error && <p className="form-error" role="alert">{error}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="app-card content-card">
        <h1>{company.name}</h1>
        {company.description && <p>{company.description}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}

        {!conversation ? (
          <button type="button" onClick={startConversation} disabled={isStarting}>
            {isStarting ? "Iniciando..." : "Iniciar conversa"}
          </button>
        ) : (
          <>
            <div className="message-list" aria-live="polite">
              {messages.length === 0 ? (
                <p>Nenhuma mensagem ainda. Envie a primeira.</p>
              ) : (
                messages.map((message) => (
                  <article key={message.id}>
                    <strong>{message.sender === "CUSTOMER" ? "Você" : "Atendimento"}</strong>
                    <p>{message.content}</p>
                  </article>
                ))
              )}
            </div>

            <form className="data-form" onSubmit={sendMessage}>
              <label htmlFor="message">Mensagem</label>
              <textarea
                id="message"
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                disabled={isSending}
                rows={3}
              />
              <button type="submit" disabled={isSending}>
                {isSending ? "Enviando..." : "Enviar"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
