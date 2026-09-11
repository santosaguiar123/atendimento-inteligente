# Atendimento Inteligente — Resolvi

Aplicação de atendimento automatizado para pequenas empresas. O administrador
cadastra o negócio e seu contexto, compartilha o canal público e acompanha as
conversas. O cliente conversa sem criar conta.

## Estado atual

Implementadas as funcionalidades das Fases 0–9: cadastro/login, empresas isoladas
por proprietário, painel de conversas, canal público, respostas automáticas com
stub ou OpenRouter, persistência, testes e imagens de produção. Deploy público
é a próxima etapa; não há endereço público configurado no repositório.

- Backend: Python 3.12, Django 5.0.6, DRF e PostgreSQL 16.
- Frontend: React 18, TypeScript, Vite 7 e React Router 7.
- Desenvolvimento: Django runserver e Vite, com atualização automática.
- Produção: Gunicorn, frontend compilado e Nginx, em Compose separado.
- Suíte do backend: 44 testes; integração externa substituída por mocks.
- Dependências frontend corrigidas; detalhes no [guia de segurança](docs/security-guide.md).

## Executar em desenvolvimento

Requisito: Docker com Docker Compose. Não é necessário instalar PostgreSQL,
Python ou Node no computador para usar os containers.

1. Copie `.env.example` para `.env` (PowerShell: `Copy-Item .env.example .env`).
   Se o arquivo já existe, ajuste-o sem sobrescrever seus valores.
2. Configure `DJANGO_SECRET_KEY` e `POSTGRES_PASSWORD` com valores próprios.
   Mantenha `DJANGO_DEBUG=True` e os hosts locais.
3. Execute:

```bash
docker compose up -d --build
docker compose exec backend python manage.py migrate
```

Acesse http://localhost:5173. API: http://localhost:8000/api/;
ping: http://localhost:8000/api/auth/ping/; admin: http://localhost:8000/admin/.

O PostgreSQL é instalado dentro do container. Em um volume vazio, ele cria o banco
e o usuário de `POSTGRES_DB`/`POSTGRES_USER` com a senha `POSTGRES_PASSWORD`.
Em um volume já inicializado, alterar essa variável não troca a senha existente.
Consulte [Produção](PRODUCTION.md) para configuração e persistência.

## Testar o produto

1. Abra `/cadastro`, crie uma conta e faça login em `/login`.
2. Em `/dashboard`, cadastre uma empresa e preencha seu contexto de atendimento.
3. Abra o link `/atendimento/<slug>`, inicie a conversa e envie uma pergunta.
4. Volte ao painel para consultar mensagens e marcar a conversa como resolvida
   ou reaberta. O painel não envia respostas manuais.

Com `AI_PROVIDER=stub`, o fluxo funciona sem chave externa, com resposta simulada.
Para respostas reais, defina `AI_PROVIDER=openrouter` e `OPENROUTER_API_KEY`.
O provider aceita `openrouter/free` ou modelos terminados em `:free`.
Após alterar o ambiente:

```bash
docker compose up -d --force-recreate backend
```

A chave é usada apenas pelo backend. Disponibilidade e limites dos modelos são
determinados pelo serviço externo. Configuração completa em
[Integração OpenRouter](docs/openrouter.md).

Quem clona o repositório pode testar com stub ou com sua própria chave.
Para visitantes testarem apenas pelo navegador, nas fases futuras será disponibilizada uma instância pública com a chave configurada no servidor.

## Produção

Siga [PRODUCTION.md](PRODUCTION.md) para configurar `.env.production`, construir
as imagens, aplicar migrations e subir http://localhost:8080.
O Compose de produção usa banco e volumes separados do desenvolvimento.

## Verificações

```bash
docker compose exec backend python manage.py check
docker compose exec backend python manage.py test
docker compose exec backend python manage.py makemigrations --check --dry-run
docker compose exec frontend npm run build
docker compose exec frontend npm run lint
docker compose exec frontend npm audit
```

Consulte [Testes](docs/testing.md) para cobertura e limites da validação.

## Documentação

| Documento | Conteúdo |
|---|---|
| [Requisitos](docs/requirements.md) | funcionalidades e escopo |
| [Arquitetura](docs/architecture.md) | componentes e fluxo de mensagens |
| [Banco](docs/database.md) | entidades, relações e persistência |
| [API](docs/api.md) | endpoints e contratos HTTP |
| [Desenvolvimento](docs/development-guide.md) | organização, comandos e diagnóstico |
| [OpenRouter](docs/openrouter.md) | respostas simuladas/reais e configuração |
| [Segurança](docs/security-guide.md) | proteções, riscos conhecidos e checklist de deploy |
| [Roadmap](docs/roadmap.md) | etapas concluídas e próximas entregas |

`PROJECT_CONTEXT.md` resume as decisões técnicas e o estado atual do projeto.
