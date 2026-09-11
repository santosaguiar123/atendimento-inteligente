# Guia de desenvolvimento

## Como navegar pelo projeto

| Caminho | Responsabilidade |
|---|---|
| backend/config/settings.py | configuração Django e padrões seguros |
| backend/config/urls.py | rotas raiz e Admin |
| backend/users/ | usuário por email, registro e login |
| backend/companies/ | empresas, isolamento por dono e consulta pública |
| backend/conversations/ | conversas, mensagens, painel e status |
| backend/ai/services.py | seleção de provider |
| backend/ai/providers/ | interface, stub e OpenRouter |
| frontend/src/App.tsx | rotas da aplicação |
| frontend/src/context/AuthContext.tsx | token e usuário no localStorage |
| frontend/src/components/ProtectedRoute.tsx | acesso ao dashboard |
| frontend/src/services/api.ts | Axios, token no header e tratamento de 401 |
| frontend/src/pages/ | início, cadastro, login, dashboard, atendimento |
| frontend/src/components/dashboard/ | formulário, empresas, conversas e mensagens |
| frontend/src/types/index.ts | tipos dos contratos HTTP |

## Ambiente de desenvolvimento

Veja o [README](../README.md). O Compose monta código local para atualização
automática. O frontend usa Node 22; para execução sem Docker, use Node 22.12+
da linha 22, Python 3.12 e uma instância PostgreSQL acessível.

Sem Docker: crie um ambiente virtual no backend, instale requirements.txt,
configure o .env da raiz com POSTGRES_HOST=localhost, execute migrate e runserver.
No frontend, use npm ci e npm run dev; configure VITE_API_URL no ambiente ou em
frontend/.env, pois o Vite não lê automaticamente o .env da raiz fora do Compose.

## Dependências

package-lock.json é versionado. Para atualizar pacotes, use npm install com
versões explícitas, revise o diff e execute npm audit, build e lint.
Não basta alterar o lockfile: o volume node_modules de um container existente
também precisa ser sincronizado.

```bash
docker compose build frontend
docker compose run --rm --no-deps frontend npm ci
docker compose up -d frontend
```

O fluxo continua em localhost:5173. Produção utiliza outro Dockerfile e
[comandos próprios](../PRODUCTION.md).

## Alterar uma funcionalidade

1. Atualize o contrato em [API](api.md) quando o comportamento HTTP mudar.
2. Implemente validação, permissões e persistência no backend.
3. Gere migrations quando houver alteração de models; preserve as já aplicadas.
4. Ajuste os tipos e páginas React que consomem o contrato.
5. Execute os checks relevantes em [Testes](testing.md).

## Fluxo de uma mensagem

PublicServicePage envia content; MessageListCreateView valida e salva CUSTOMER,
consulta o histórico recente, chama ai.services e salva AI.
O POST retorna CUSTOMER (201), depois o frontend faz GET das mensagens.
Falha externa retorna 502 preservando CUSTOMER; não é rollback da operação toda.

## Diagnóstico

| Sintoma | Conferir |
|---|---|
| Resposta simulada com chave preenchida | AI_PROVIDER precisa ser openrouter |
| Erro de conexão ao banco | host interno db, healthcheck, senha do volume e migrations |
| Django recusa inicialização | DJANGO_SECRET_KEY; em produção também hosts e senha |
| HTTP 400 por host | DJANGO_ALLOWED_HOSTS sem protocolo/porta e sem wildcard |
| Frontend não acessa API em dev | VITE_API_URL e CORS_ALLOWED_ORIGINS |
| Resposta 502 ao enviar mensagem | configuração e disponibilidade do provider; logs backend |
| Mudança no .env não aparece | recriar container; restart não atualiza o ambiente |
| Senha nova não funciona no banco existente | alterar senha no próprio PostgreSQL, não apagar volume |

Não exiba valores de segredos em logs de diagnóstico.