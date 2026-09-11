# Modelagem do Banco de Dados — Atendimento Inteligente

## 1. Visão geral

Quatro entidades no MVP: `User`, `Company`, `Conversation`, `Message`. Analisando o
domínio, uma decisão importante foi **não** criar um model de usuário para o cliente
final — ver justificativa na seção 4 (Conversation).

```
┌───────────────┐        ┌────────────────┐        ┌────────────────┐        ┌────────────────┐
│     User       │ 1    N │    Company      │ 1    N │  Conversation   │ 1    N │    Message      │
│ (administrador)│───────▶│                │───────▶│                │───────▶│                │
└───────────────┘        └────────────────┘        └────────────────┘        └────────────────┘
```

- Um `User` (administrador) pode ter várias `Company`.
- Uma `Company` pode ter várias `Conversation`.
- Uma `Conversation` pode ter várias `Message`.

## 2. `User`

**Propósito**: representar o administrador que possui uma ou mais empresas na
plataforma. É um **custom User model** (`AUTH_USER_MODEL`), decisão explicada abaixo.

| Campo | Tipo | Restrições |
|---|---|---|
| `id` | `UUID` (PK) | gerado automaticamente |
| `email` | `EmailField` | `unique=True`, usado como `USERNAME_FIELD` |
| `full_name` | `CharField(150)` | opcional na v1 |
| `is_active` | `BooleanField` | default `True` |
| `is_staff` | `BooleanField` | default `False` (acesso ao Django Admin) |
| `date_joined` | `DateTimeField` | `auto_now_add=True` |
| `password` | gerenciado pelo Django (`AbstractBaseUser`) | hash automático |

**Por que um custom User model desde o início?** Trocar o model de usuário depois
que já existem migrations em produção é doloroso (é uma migration estrutural que
mexe em todas as FKs para `User`). A prática recomendada pela própria documentação do
Django é sempre começar com um custom user model, mesmo que no início ele seja quase
idêntico ao padrão — assim, se no futuro você precisar de campos extra (telefone,
avatar, papel/role), não há retrabalho. Usamos `email` como identificador de login em
vez de `username` porque é o padrão mais natural para uma aplicação B2B como essa.

## 3. `Company`

**Propósito**: representar o negócio cadastrado por um administrador, incluindo o
contexto que a IA usará para responder.

| Campo | Tipo | Restrições |
|---|---|---|
| `id` | `UUID` (PK) | gerado automaticamente |
| `owner` | `ForeignKey(User)` | `on_delete=CASCADE`, `related_name="companies"` |
| `name` | `CharField(150)` | obrigatório |
| `slug` | `SlugField` | `unique=True`, usado na URL pública do canal (`/atendimento/<slug>/`) |
| `description` | `TextField` | opcional — descrição curta do negócio |
| `ai_context` | `TextField` | aceita vazio atualmente; texto livre com informações que a IA deve usar (horários, políticas, produtos, FAQ) |
| `created_at` | `DateTimeField` | `auto_now_add=True` |
| `updated_at` | `DateTimeField` | `auto_now=True` |

**Índices**: `slug` já é indexado por ser `unique=True`. Um índice em `owner_id`
(criado automaticamente pela FK) cobre a query mais comum: "listar empresas do
administrador logado".

**Por que `ai_context` como campo de texto livre e não uma tabela de FAQ
estruturada?** Estruturar FAQs em uma tabela separada (pergunta/resposta) seria mais
"correto" no sentido relacional, mas adicionaria complexidade de UI e de modelagem
antes de você validar se o fluxo básico de IA funciona. Um campo de texto livre é o
suficiente para o MVP e é um ponto natural de evolução futura (ver `roadmap.md`).

## 4. `Conversation`

**Propósito**: representar uma sessão de atendimento entre um cliente (anônimo) e a
empresa.

| Campo | Tipo | Restrições |
|---|---|---|
| `id` | `UUID` (PK) | gerado automaticamente — serve como "token" da conversa no frontend |
| `company` | `ForeignKey(Company)` | `on_delete=CASCADE`, `related_name="conversations"` |
| `customer_identifier` | `CharField(150)` | opcional — identificador leve do cliente (ex.: nome informado, ou vazio) |
| `status` | `CharField` com `choices` | `OPEN` / `CLOSED`, default `OPEN`; o dono pode alternar no painel, sem bloquear mensagens publicas |
| `created_at` | `DateTimeField` | `auto_now_add=True` |
| `updated_at` | `DateTimeField` | `auto_now=True` |

**Índice**: `company_id` (via FK) — cobre "listar conversas de uma empresa".

**Por que não existe um model `Customer`?** No MVP, o cliente final não se autentica
— ele só precisa acessar o link/slug da empresa e conversar. Criar contas de cliente
agora seria escopo que o requisito não pede (ver `requirements.md`, RF06/RF07) e
atrasaria a validação do fluxo principal. O `id` (UUID) da própria `Conversation` já
funciona como identificador da sessão no frontend (guardado no
`localStorage` do navegador do cliente). Se no futuro for necessário reconhecer o
mesmo cliente entre conversas diferentes, um model `Customer` pode ser introduzido
sem quebrar o restante do domínio.

## 5. `Message`

**Propósito**: cada mensagem trocada dentro de uma conversa, seja do cliente ou da
IA.

| Campo | Tipo | Restrições |
|---|---|---|
| `id` | `UUID` (PK) | gerado automaticamente |
| `conversation` | `ForeignKey(Conversation)` | `on_delete=CASCADE`, `related_name="messages"` |
| `sender` | `CharField` com `choices` | `CUSTOMER` / `AI` (preparado para `HUMAN` no futuro) |
| `content` | `TextField` | obrigatório |
| `created_at` | `DateTimeField` | `auto_now_add=True`, usado para ordenar a conversa |

**Índice**: `(conversation_id, created_at)` — composto, pois a query mais comum é
"buscar as mensagens de uma conversa em ordem cronológica".

## 6. Diagrama ER simplificado

```
┌────────────────────┐
│        User          │
├────────────────────┤
│ id (PK, UUID)         │
│ email (unique)        │
│ full_name             │
│ is_active              │
│ is_staff               │
│ date_joined            │
└─────────┬───────────┘
          │ 1
          │
          │ N
┌─────────▼───────────┐
│      Company          │
├────────────────────┤
│ id (PK, UUID)          │
│ owner_id (FK → User)   │
│ name                   │
│ slug (unique)          │
│ description            │
│ ai_context              │
│ created_at / updated_at│
└─────────┬───────────┘
          │ 1
          │
          │ N
┌─────────▼───────────┐
│    Conversation        │
├────────────────────┤
│ id (PK, UUID)          │
│ company_id (FK)        │
│ customer_identifier    │
│ status                 │
│ created_at / updated_at│
└─────────┬───────────┘
          │ 1
          │
          │ N
┌─────────▼───────────┐
│       Message          │
├────────────────────┤
│ id (PK, UUID)          │
│ conversation_id (FK)   │
│ sender (customer/ai)   │
│ content                │
│ created_at              │
└────────────────────┘
```

## 7. Decisões gerais de modelagem

- **UUID como chave primária** em vez de inteiro autoincrement: os IDs de `Company` e
  `Conversation` aparecem em URLs públicas (canal de atendimento, links de conversa).
  UUID evita expor "quantas empresas existem" ou permitir enumeração sequencial
  (`/empresa/1`, `/empresa/2`, ...). O custo (chaves um pouco maiores) é aceitável
  para o tamanho deste projeto.
- **`on_delete=CASCADE`** em todas as FKs: se uma empresa é apagada, suas conversas e
  mensagens deixam de fazer sentido — cascatear é o comportamento correto aqui. Isso
  é uma decisão consciente, não o padrão "por preguiça".
- **Sem tabela de permissões/roles separada**: no MVP existe só um papel
  (administrador dono da empresa). Uma tabela de `Role`/`Permission` genérica seria
  overengineering agora — ver `roadmap.md` para quando isso deve entrar.

## 8. Persistencia e operacao atuais

PostgreSQL 16 roda no Docker; desenvolvimento e producao usam volumes separados.
Migrations devem ser aplicadas em cada banco, sem reorganizar as ja aplicadas.
A senha do ambiente e usada na inicializacao do volume; alterar o arquivo nao
troca a senha de um usuario existente. Veja ../PRODUCTION.md.

Conversation.updated_at muda ao salvar a conversa, mas a criacao de Message nao
o atualiza. CLOSED e um marcador administrativo. O POST preserva CUSTOMER quando
a geracao falha; somente o sucesso cria AI. Nao existe sender HUMAN ativo.
