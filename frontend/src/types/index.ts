/**
 * Tipos que espelham os serializers do backend (ver docs/api.md).
 * Mantê-los sincronizados manualmente é aceitável no tamanho atual do projeto;
 * se o contrato crescer muito, considere gerar esses tipos automaticamente a
 * partir do schema da API (ex.: openapi-typescript) — não é necessário no MVP.
 */

export interface User {
  id: string;
  email: string;
  full_name: string;
  date_joined: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  description: string;
  ai_context: string;
  created_at: string;
  updated_at: string;
}

export interface PublicCompany {
  name: string;
  slug: string;
  description: string;
}

export interface Conversation {
  id: string;
  company: string;
  customer_identifier: string;
  status: "OPEN" | "CLOSED";
  created_at: string;
}

export interface Message {
  id: string;
  sender: "CUSTOMER" | "AI";
  content: string;
  created_at: string;
}

export interface MessagePreview {
  sender: "CUSTOMER" | "AI";
  content: string;
  created_at: string;
}

/**
 * Espelha ConversationSummarySerializer (ver docs/api.md,
 * GET /api/companies/{id}/conversations/). Usado só no painel da empresa —
 * a lista de mensagens completa de uma conversa continua vindo de
 * GET /api/conversations/{id}/messages/ (tipo `Message[]` acima).
 */
export interface ConversationSummary {
  id: string;
  customer_identifier: string;
  status: "OPEN" | "CLOSED";
  created_at: string;
  updated_at: string;
  last_message: MessagePreview | null;
  messages_count: number;
}
