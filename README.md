# Atendimento Inteligente

Plataforma web onde uma empresa cadastra informações sobre o próprio negócio e
disponibiliza um canal de atendimento em que clientes conversam com uma IA
treinada com esse contexto — reduzindo o volume de perguntas repetitivas
respondidas manualmente.

> Projeto pessoal em desenvolvimento, construído como exercício de arquitetura de
> software real (planejamento → modelagem → API → frontend/backend → containers →
> deploy), não apenas de código.

## Status

🚧 **Em desenvolvimento.** Este repositório contém a fundação do projeto: estrutura,
configuração, modelos de dados e documentação. A implementação das funcionalidades
está em andamento — acompanhe o progresso em [`docs/roadmap.md`](docs/roadmap.md).

## Problema e objetivo

Pequenos negócios recebem, todo dia, as mesmas perguntas (horário, formas de
pagamento, prazos, políticas). Responder isso manualmente é repetitivo e depende de
quem está de plantão. O objetivo desta plataforma é automatizar essa camada de
atendimento com um assistente de IA que usa o contexto cadastrado pela própria
empresa — sem precisar treinar um modelo próprio.

Documentação completa do problema, público-alvo e requisitos:
[`docs/requirements.md`](docs/requirements.md).

## Escopo do MVP

**Entra na primeira versão:**
- Cadastro e login de administrador.
- Cadastro de empresa com informações de contexto para a IA.
- Canal público de atendimento por empresa (link único).
- Conversa entre cliente e IA, persistida no banco.

**Fica para depois** (ver [`docs/roadmap.md`](docs/roadmap.md), Fase 11):
atendentes humanos, dashboard com analytics, múltiplos administradores por empresa,
notificações, integrações externas, CI/CD.

## Stack

| Camada | Tecnologia | Por quê |
|---|---|---|
| Backend | Python + Django + Django REST Framework | produtivo para APIs REST, ORM e autenticação maduros |
| Banco de dados | PostgreSQL | banco relacional robusto, domínio naturalmente relacional |
| Frontend | React + TypeScript (Vite) | tipagem estática ajuda a manter o contrato com a API; padrão de mercado |
| Comunicação | HTTP / REST / JSON | contrato simples e bem documentado (`docs/api.md`) |
| Containers | Docker + Docker Compose | ambiente de desenvolvimento reproduzível, sem orquestração desnecessária |
| IA | Provider plugável via interface própria | permite trocar de provedor sem reescrever regra de negócio |

Justificativa completa de cada decisão em [`docs/architecture.md`](docs/architecture.md).

**Por que TypeScript em vez de JavaScript?** O custo de aprendizado extra vindo de
JavaScript é pequeno, e o ganho é real: como o frontend consome uma API definida por
contrato (`docs/api.md`), tipar as respostas faz o editor avisar imediatamente se o
frontend e o backend saírem de sincronia — um problema comum em projetos reais. Além
disso, é o padrão predominante em vagas e projetos de portfólio profissionais.

## Arquitetura (visão geral)

```
Cliente (navegador)
   │
   ▼
React (frontend, porta 5173)
   │  HTTP / REST / JSON
   ▼
Django REST Framework (backend, porta 8000)
   │  Django ORM
   ▼
PostgreSQL (porta 5432)
   │
   ▼
Provedor de IA (interface própria — stub no MVP, plugável no futuro)
```

Monólito modular, de propósito: sem microsserviços, sem Kubernetes, sem fila de
mensagens. Ver a justificativa completa e os diagramas detalhados em
[`docs/architecture.md`](docs/architecture.md).

## Estrutura do repositório

```
atendimento-inteligente/
├── backend/                 # Django + DRF (API REST)
│   ├── config/               # settings, urls raiz, wsgi/asgi
│   ├── users/                 # usuário/administrador customizado
│   ├── companies/             # empresas cadastradas
│   ├── conversations/         # conversas e mensagens
│   ├── ai/                    # abstração do provedor de IA
│   ├── manage.py
│   └── requirements.txt
├── frontend/                 # React + TypeScript (Vite)
│   └── src/
│       ├── pages/              # telas roteadas
│       ├── components/         # componentes reutilizáveis
│       ├── services/           # cliente HTTP (Axios)
│       ├── hooks/               # hooks customizados
│       ├── context/             # estado global leve (ex.: autenticação)
│       └── types/                # tipos TS espelhando o contrato da API
├── docs/                     # planejamento e decisões arquiteturais
│   ├── requirements.md
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   ├── roadmap.md
│   └── development-guide.md   # guia de estudo durante o desenvolvimento
├── docker-compose.yml
├── .env.example
└── .gitignore
```

Cada pasta existe por um motivo específico — nada foi criado "porque é padrão".
Ver a justificativa de cada app do backend e pasta do frontend em
[`docs/architecture.md`](docs/architecture.md) (seções 5 e 6, no corpo do documento
de arquitetura) e um mapa prático de navegação em
[`docs/development-guide.md`](docs/development-guide.md).

## Como executar localmente

### Pré-requisitos
- Docker e Docker Compose instalados.
- (Alternativa sem Docker) Python 3.12+, Node.js 20+ e um PostgreSQL local.

### 1. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Abra o `.env` e ajuste `DJANGO_SECRET_KEY` e `POSTGRES_PASSWORD` (os valores padrão
servem apenas para desenvolvimento local, nunca para produção).

### 2. Subir o ambiente com Docker Compose

```bash
docker compose up --build
```

Isso sobe três serviços: `db` (PostgreSQL), `backend` (Django, porta 8000) e
`frontend` (Vite, porta 5173).

### 3. Rodar as migrations

Os models já existem no código, mas as migrations ainda **não** foram geradas neste
repositório (ver nota na seção "Validação" abaixo). Em outro terminal, com os
containers no ar:

```bash
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
```

### 4. Criar um superusuário (opcional, para acessar o Django Admin)

```bash
docker compose exec backend python manage.py createsuperuser
```

### 5. Acessar

- Frontend: http://localhost:5173
- API: http://localhost:8000/api/
- Endpoint de verificação (já funcional, sem autenticação): http://localhost:8000/api/auth/ping/
- Django Admin: http://localhost:8000/admin/

### Rodando sem Docker (alternativa)

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

Neste caso, ajuste `POSTGRES_HOST=localhost` no `.env` (em vez de `db`) e garanta
que exista um PostgreSQL rodando localmente com as credenciais do `.env`.

## Validação desta fundação

Este projeto foi gerado em um ambiente sandbox **sem acesso à internet**, portanto
os itens abaixo não puderam ser executados/verificados no momento da criação —
verifique-os no seu ambiente antes de começar a desenvolver:

| Item | Status |
|---|---|
| Sintaxe Python de todos os arquivos do backend | ✅ Verificado (`python -m py_compile`) |
| Estrutura de pastas coerente entre `config/settings.py`, apps e `docker-compose.yml` | ✅ Revisado manualmente |
| Ausência de segredos reais no código (`.env` não versionado, `.env.example` sem valores reais) | ✅ Verificado |
| `.gitignore` cobre Python/Django/Node/React/Docker/IDEs/`.env` | ✅ Verificado |
| `pip install -r requirements.txt` executa sem erro | ⚠️ **Não verificado** (sem acesso à internet no ambiente de geração) |
| `npm install` executa sem erro | ⚠️ **Não verificado** (idem) |
| `docker compose up --build` sobe os três serviços | ⚠️ **Não verificado** (idem) |
| Django consegue conectar ao PostgreSQL | ⚠️ **Não verificado** (depende dos itens acima) |
| `makemigrations` / `migrate` executam sem erro | ⚠️ **Não verificado** (depende do Django estar instalado) |

Se algum desses itens falhar no seu ambiente, é o primeiro lugar a investigar — e é
um ótimo primeiro exercício de debug de configuração real.

## Documentação completa

| Documento | Conteúdo |
|---|---|
| [`docs/requirements.md`](docs/requirements.md) | Problema, público-alvo, personas, requisitos, escopo do MVP |
| [`docs/architecture.md`](docs/architecture.md) | Arquitetura geral, componentes, fluxo de mensagem, decisões |
| [`docs/database.md`](docs/database.md) | Modelagem das entidades, diagrama ER, justificativas |
| [`docs/api.md`](docs/api.md) | Contrato da API REST (endpoints, autenticação, erros) |
| [`docs/roadmap.md`](docs/roadmap.md) | Fases de desenvolvimento com tarefas concretas |
| [`docs/development-guide.md`](docs/development-guide.md) | Guia de estudo e mapa de navegação do projeto |

## Próximos passos

Ver [`docs/roadmap.md`](docs/roadmap.md) — você está terminando a Fase 1 (Setup).
O próximo passo concreto é validar o ambiente local (seção "Como executar
localmente" acima) e então gerar as primeiras migrations (Fase 2).

## Licença

Projeto pessoal de estudo/portfólio. Sem licença definida ainda — adicione uma
(ex. MIT) se e quando o repositório for tornado público.
