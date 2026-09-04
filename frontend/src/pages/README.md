# pages/

Cada arquivo aqui representa uma **tela completa** roteada pelo React Router
(ex.: `Login.tsx`, `Dashboard.tsx`, `AtendimentoPublico.tsx`) — ver Fase 6 do
roadmap em `docs/roadmap.md`.

Uma página compõe componentes de `src/components/` e chama a API através de
`src/services/`. Regra prática: se o conteúdo tem sua própria rota/URL, é uma
page; se é reutilizado dentro de páginas diferentes, é um component.
