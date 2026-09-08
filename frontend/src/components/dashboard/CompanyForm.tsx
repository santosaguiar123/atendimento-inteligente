import { Check, Copy } from "lucide-react";
import { type FormEvent, useState } from "react";

export interface CompanyFormValues {
  name: string;
  description: string;
  ai_context: string;
}

interface CompanyFormProps {
  initial: CompanyFormValues;
  publicSlug?: string;
  isSaving: boolean;
  error: string;
  successMessage: string;
  submitLabel: string;
  onSubmit: (values: CompanyFormValues) => void;
  onCancel?: () => void;
}

export function CompanyForm({
  initial,
  publicSlug,
  isSaving,
  error,
  successMessage,
  submitLabel,
  onSubmit,
  onCancel,
}: CompanyFormProps) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [aiContext, setAiContext] = useState(initial.ai_context);
  const [linkCopied, setLinkCopied] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ name: name.trim(), description, ai_context: aiContext });
  }

  async function handleCopyLink() {
    if (!publicSlug) return;
    const url = `${window.location.origin}/atendimento/${publicSlug}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Clipboard indisponível (ex.: contexto não-seguro) — sem tratamento
      // especial, a pessoa ainda pode selecionar e copiar o texto manualmente.
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="company-name">Nome da empresa</label>
        <div className="field-input">
          <input
            id="company-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Padaria do João"
            required
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="company-description">Descrição pública</label>
        <div className="field-input">
          <textarea
            id="company-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            placeholder="Aparece para o cliente na página de atendimento."
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="company-context">Contexto para a IA</label>
        <div className="field-input">
          <textarea
            id="company-context"
            value={aiContext}
            onChange={(event) => setAiContext(event.target.value)}
            rows={7}
            placeholder="Horários de funcionamento, políticas, produtos, FAQ... quanto mais completo, melhores as respostas automáticas."
          />
        </div>
        <p className="field-hint">Só a IA vê este texto — não aparece para o cliente.</p>
      </div>

      {error && <p className="form-banner error" role="alert">{error}</p>}
      {successMessage && <p className="form-banner success" role="status">{successMessage}</p>}

      <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          {isSaving ? "Salvando..." : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </button>
        )}
      </div>

      {publicSlug && (
        <p className="field-hint" style={{ marginTop: 18 }}>
          Link público de atendimento:{" "}
          <code>/atendimento/{publicSlug}</code>{" "}
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleCopyLink} style={{ padding: "2px 8px" }}>
            {linkCopied ? <Check size={13} /> : <Copy size={13} />}
            {linkCopied ? "Copiado" : "Copiar"}
          </button>
        </p>
      )}
    </form>
  );
}
