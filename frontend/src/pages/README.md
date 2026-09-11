# Páginas

- HomePage: página inicial em /.
- RegisterPage: cadastro em /cadastro.
- LoginPage: autenticação em /login.
- DashboardPage: empresas, contexto, conversas e status em /dashboard.
- PublicServicePage: canal anônimo em /atendimento/:slug.

As rotas ficam em App.tsx. ProtectedRoute protege o dashboard; chamadas HTTP
usam services/api.ts. O canal público restaura o UUID da conversa por empresa
no localStorage e busca o histórico após cada envio bem-sucedido.