# Atendimento Inteligente

Plataforma web de atendimento automatizado para pequenas e médias empresas. O
administrador cadastra o contexto do negócio e disponibiliza um canal público no
qual clientes conversam com um assistente de IA preparado para responder perguntas
recorrentes.

Projeto em desenvolvimento, usado como exercício prático de arquitetura, API REST,
frontend, persistência, testes, containers e integração com IA.

## Estado atual

O backend do fluxo anterior à IA já está funcional:

- ambiente local com PostgreSQL, Django e Vite via Docker Compose;
- registro e login do administrador por token;
- criação, listagem e edição de empresas, isoladas por proprietário;
- consulta pública de empresa por slug, sem exposição do contexto interno;
- criação de conversas e listagem/criação de mensagens do cliente;
- migrations aplicadas e sem alterações pendentes;
- 17 testes automatizados passando;
- verificação do Django, build e lint do frontend passando.

O próximo marco é concluir a Fase 5: conectar o envio de mensagens à camada de IA e
persistir a resposta automática. O frontend ainda é a tela inicial da fundação. As
tarefas restantes estão em [`docs/roadmap.md`](docs/roadmap.md).

## Problema e objetivo

Pequenos negócios recebem diariamente as mesmas perguntas: horários, formas de
pagamento, prazos e políticas. A plataforma automatiza essa primeira camada usando
o contexto cadastrado pela empresa, sem exigir o treino de um modelo próprio.

O MVP não pretende substituir definitivamente o atendimento humano. Seu foco é
validar um canal para perguntas frequentes que possa evoluir para um modelo híbrido.
Consulte [`docs/requirements.md`](docs/requirements.md).

## Escopo do MVP

Incluído:

- cadastro e login de administrador;
- cadastro e edição de empresas com contexto para a IA;
- canal público identificado por slug;
- conversa entre cliente e IA com persistência no banco;
- ambiente local reproduzível com Docker Compose.

Atendimento humano, analytics, múltiplos administradores, notificações, integrações
externas e billing ficam fora do MVP.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Python 3.12, Django 5 e Django REST Framework |
| Banco | PostgreSQL 16 |
| Frontend | React 18, TypeScript e Vite 5 |
| Comunicação | HTTP, REST e JSON |
| Ambiente | Docker e Docker Compose |
| IA | interface própria com provider substituível |

As decisões estão explicadas em [`docs/architecture.md`](docs/architecture.md).

## Arquitetura

```text
React + TypeScript (porta 5173)
        | HTTP / REST / JSON
        v
Django REST Framework (porta 8000)
        | Django ORM
        v
PostgreSQL (porta 5432)

Django -> camada ai -> provider stub ou provider externo
```

É um monólito modular, sem microsserviços, Kubernetes ou fila no MVP.

## Estrutura

```text
atendimento-inteligente/
├── backend/
│   ├── config/            # configuração e rotas raiz
│   ├── users/             # usuário, registro e login
│   ├── companies/         # empresas e canal público
│   ├── conversations/     # conversas e mensagens
│   └── ai/                # abstração do provider
├── frontend/src/          # interface, serviços e tipos
├── docs/                  # documentação do produto e do código
├── docker-compose.yml
└── .env.example
```

## Como executar localmente

Pré-requisitos: Docker com Docker Compose. Para rodar sem containers, use Python
3.12+, Node.js 20+ e PostgreSQL.

1. Crie a configuração local:

   ```bash
   cp .env.example .env
   ```

   No PowerShell: `Copy-Item .env.example .env`.

2. Ajuste `DJANGO_SECRET_KEY` e `POSTGRES_PASSWORD`.

3. Suba e prepare o ambiente:

   ```bash
   docker compose up --build
   docker compose exec backend python manage.py migrate
   ```

4. Opcionalmente, crie um superusuário:

   ```bash
   docker compose exec backend python manage.py createsuperuser
   ```

Acessos locais:

- frontend: http://localhost:5173
- API: http://localhost:8000/api/
- diagnóstico: http://localhost:8000/api/auth/ping/
- Django Admin: http://localhost:8000/admin/

### Sem Docker

```bash
# backend
cd backend
python -m venv .venv
# Linux/macOS: source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# frontend, em outro terminal
cd frontend
npm install
npm run dev
```

Configure `POSTGRES_HOST=localhost` no `.env` nesse modo.

## Verificação

Com os containers ativos:

```bash
docker compose exec backend python manage.py check
docker compose exec backend python manage.py test
docker compose exec backend python manage.py makemigrations --check --dry-run
docker compose exec frontend npm run build
docker compose exec frontend npm run lint
```

Na verificação de 5 de setembro de 2026, todos esses comandos passaram, com 17
testes no backend e nenhuma migration pendente.

## Documentação

| Documento | Conteúdo |
|---|---|
| [`docs/requirements.md`](docs/requirements.md) | problema, requisitos e escopo |
| [`docs/architecture.md`](docs/architecture.md) | componentes, fronteiras e decisões |
| [`docs/database.md`](docs/database.md) | entidades, relações e modelagem |
| [`docs/api.md`](docs/api.md) | contrato atual e planejado da API |
| [`docs/roadmap.md`](docs/roadmap.md) | progresso e tarefas restantes |
| [`docs/development-guide.md`](docs/development-guide.md) | mapa do código e orientação |

O repositório permanece privado durante o desenvolvimento.
