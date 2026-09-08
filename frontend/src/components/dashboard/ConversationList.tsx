import type { ConversationSummary } from "../../types";
import { formatDateTime } from "../../utils/format";

interface ConversationListProps {
  conversations: ConversationSummary[];
  selectedConversationId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelect,
  isLoading,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="conv-list">
        <p className="conv-list-empty">Carregando conversas...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="conv-list">
        <p className="conv-list-empty">
          Nenhuma conversa recebida ainda. Compartilhe o link público desta empresa com seus clientes.
        </p>
      </div>
    );
  }

  return (
    <div className="conv-list">
      {conversations.map((conversation) => {
        const isOpen = conversation.status === "OPEN";
        const title = conversation.customer_identifier || "Cliente anônimo";

        return (
          <button
            key={conversation.id}
            type="button"
            className={`conv-item${conversation.id === selectedConversationId ? " active" : ""}`}
            onClick={() => onSelect(conversation.id)}
          >
            <div className="conv-item-top">
              <strong>{title}</strong>
              <time>{formatDateTime(conversation.updated_at)}</time>
            </div>
            <div className="conv-item-msg">
              {conversation.last_message
                ? conversation.last_message.content
                : "Nenhuma mensagem ainda"}
            </div>
            <span className={`status-chip ${isOpen ? "open" : "closed"}`}>
              <span className="status-dot" />
              {isOpen ? "Em aberto" : "Resolvida"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
