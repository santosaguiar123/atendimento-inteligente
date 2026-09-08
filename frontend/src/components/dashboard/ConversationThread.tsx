import { Bot, CheckCircle2, Info, RotateCcw, Send } from "lucide-react";

import type { ConversationSummary, Message } from "../../types";
import { formatDateTime, getInitials } from "../../utils/format";

interface ConversationThreadProps {
  conversation: ConversationSummary | null;
  messages: Message[];
  isLoadingMessages: boolean;
  onToggleStatus: () => void;
  isTogglingStatus: boolean;
  statusError?: string;
}

export function ConversationThread({
  conversation,
  messages,
  isLoadingMessages,
  onToggleStatus,
  isTogglingStatus,
  statusError,
}: ConversationThreadProps) {
  if (!conversation) {
    return (
      <div className="thread-panel">
        <div className="thread-empty">Selecione uma conversa à esquerda para ver as mensagens.</div>
      </div>
    );
  }

  const isOpen = conversation.status === "OPEN";
  const title = conversation.customer_identifier || "Cliente anônimo";

  return (
    <div className="thread-panel">
      <div className="thread-head">
        <div className="thread-head-info">
          <h2>{title}</h2>
          <div className="sub">Conversa iniciada em {formatDateTime(conversation.created_at)}</div>
        </div>
        <button
          type="button"
          className={isOpen ? "btn btn-outline btn-sm" : "btn btn-outline btn-sm"}
          onClick={onToggleStatus}
          disabled={isTogglingStatus}
        >
          {isOpen ? <CheckCircle2 size={14} /> : <RotateCcw size={14} />}
          {isTogglingStatus ? "Salvando..." : isOpen ? "Marcar como resolvida" : "Reabrir conversa"}
        </button>
      </div>

      {statusError && (
        <p className="form-banner error" role="alert" style={{ margin: "0 28px 12px" }}>
          {statusError}
        </p>
      )}

      <div className="thread-scroll">
        {isLoadingMessages ? (
          <p style={{ color: "var(--neutro-500)", fontSize: 14 }}>Carregando mensagens...</p>
        ) : messages.length === 0 ? (
          <p style={{ color: "var(--neutro-500)", fontSize: 14 }}>Esta conversa ainda não tem mensagens.</p>
        ) : (
          messages.map((message) => {
            const isCustomer = message.sender === "CUSTOMER";
            return (
              <div key={message.id} className={`bubble-row ${isCustomer ? "from-customer" : "from-ai"}`}>
                <span className="bubble-avatar">
                  {isCustomer ? getInitials(title) : <Bot size={14} />}
                </span>
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
      </div>

      <div className="empty-note">
        <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          Resposta manual da empresa ainda não está disponível nesta fase do projeto — hoje, cada
          mensagem do cliente recebe automaticamente uma resposta da IA.
        </span>
      </div>

      <div className="reply-box">
        <div className="reply-input-row">
          <textarea placeholder="Resposta manual em breve..." disabled />
          <button type="button" className="btn btn-primary" disabled>
            <Send size={14} /> Enviar
          </button>
        </div>
        <div className="reply-foot">
          <span className="note">Fase futura do roadmap (ver docs/roadmap.md).</span>
        </div>
      </div>
    </div>
  );
}
