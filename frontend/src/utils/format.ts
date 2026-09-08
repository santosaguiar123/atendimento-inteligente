/**
 * Formata uma data ISO (vinda da API) para exibição curta em pt-BR.
 * Ex.: "06/09, 14:22". Sem dependência externa (date-fns etc.) — não é
 * necessário para o volume de datas exibido no MVP.
 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Extrai até duas iniciais de um nome/identificador para exibir num avatar. */
export function getInitials(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "?";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
