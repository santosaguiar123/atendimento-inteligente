/**
 * Ponto de entrada visual da aplicação.
 *
 * TODO (Fase 6 do roadmap — ver docs/roadmap.md):
 * Introduzir React Router aqui com pelo menos três rotas:
 *   - "/login"                -> tela de login/cadastro do administrador
 *   - "/dashboard"             -> área autenticada (cadastro/edição de empresa)
 *   - "/atendimento/:slug"     -> canal público de atendimento (chat)
 *
 * Por enquanto, esta tela serve apenas para confirmar que o frontend está de pé
 * e consegue, futuramente, falar com o backend (ver src/services/api.ts).
 */
export default function App() {
  return (
    <main className="app-shell">
      <div className="app-card">
        <h1>Atendimento Inteligente</h1>
        <p>
          Fundação do frontend criada. As telas de login, cadastro de empresa e o
          canal de atendimento serão implementadas na Fase 6 do roadmap.
        </p>
        <p className="app-hint">
          Veja <code>docs/development-guide.md</code> para saber por onde começar.
        </p>
      </div>
    </main>
  );
}
