# Contrato de API — Atendimento Inteligente

Convenções gerais:

- Base URL dev: `http://localhost:8000/api/`; producao local: `http://localhost:8080/api/`
- Formato: JSON em request e response (`Content-Type: application/json`)
- Autenticação: Token Authentication do DRF — header `Authorization: Token <token>`
- Erros seguem o formato padrão do DRF: `{"campo": ["mensagem de erro"]}` ou
  `{"detail": "mensagem de erro"}` para erros gerais.
- Datas em ISO 8601 (`2026-09-02T14:30:00Z`).

> Autenticação, empresas, criação de conversas, persistência de mensagens do
> cliente e a resposta automática da IA (Fase 5) estão funcionais. O painel da
> empresa (Fase 6) pode listar as conversas recebidas e marcar uma conversa como
> resolvida/reaberta. Resposta manual da empresa (sender `HUMAN`) ainda não existe
> — ver `Message.Sender` em `conversations/models.py`.

---

## Autenticação

### `POST /api/auth/register/`

Cria uma nova conta de administrador.

- **Autenticação**: não requerida.
- **Request**:
  ```json
  {
    "email": "admin@exemplo.com",
    "full_name": "Maria Silva",
    "password": "senha-forte-123"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "id": "b3f1...",
    "email": "admin@exemplo.com",
    "full_name": "Maria Silva",
    "date_joined": "2026-09-05T14:30:00Z"
  }
  ```
- **Erros possíveis**:
  - `400` — e-mail já cadastrado, senha fraca, campos ausentes.

### `POST /api/auth/login/`

Autentica um administrador e retorna um token.

- **Autenticação**: não requerida.
- **Request**:
  ```json
  { "email": "admin@exemplo.com", "password": "senha-forte-123" }
  ```
- **Response `200 OK`**:
  ```json
  { "token": "<token-retornado-pelo-servidor>" }
  ```
- **Erros possíveis**:
  - `400` — credenciais inválidas.

### Logout

Nao ha endpoint de logout implementado. O frontend remove token e usuario do
localStorage; o token permanece valido no servidor.

### `GET /api/auth/ping/`

Publico. Retorna 200 com status=ok e service=atendimento-inteligente-backend.
Confirma disponibilidade HTTP; nao verifica banco nem OpenRouter.

---

## Empresas

### `GET /api/companies/`

Lista as empresas do administrador autenticado.

- **Autenticação**: requerida.
- **Response `200 OK`**:
  ```json
  [
    {
      "id": "a1c2...",
      "name": "Padaria do João",
      "slug": "padaria-do-joao",
      "description": "Padaria de bairro",
      "created_at": "2026-09-01T10:00:00Z"
    }
  ]
  ```

### `POST /api/companies/`

Cria uma empresa vinculada ao administrador autenticado.

- **Autenticação**: requerida.
- **Request**:
  ```json
  {
    "name": "Padaria do João",
    "description": "Padaria de bairro, aberta desde 1998",
    "ai_context": "Funcionamos de segunda a sábado, das 6h às 20h. Aceitamos pix, cartão e dinheiro. Fazemos encomendas de bolo com 2 dias de antecedência."
  }
  ```
- **Response `201 Created`**: objeto da empresa criada, incluindo `slug` gerado
  automaticamente a partir do `name`.
- **Erros possíveis**:
  - `400` — nome ausente/inválido.
  - `401` — sem autenticação.

### `GET /api/companies/{id}/`

Detalha uma empresa (apenas o dono pode acessar).

- **Autenticação**: requerida.
- **Erros possíveis**:
  - `404` — empresa não existe ou não pertence ao usuário autenticado. A API não
    revela a existência de recursos de outro proprietário.

### `PATCH /api/companies/{id}/`

Atualiza campos da empresa (ex.: `ai_context`, `description`).

- **Autenticação**: requerida (apenas o dono).
- **Request**: qualquer subconjunto dos campos editáveis.
- **Response `200 OK`**: objeto atualizado.

---

## Canal público de atendimento

### `GET /api/public/companies/{slug}/`

Retorna dados públicos da empresa para renderizar o canal (nome, descrição — **nunca**
o `ai_context` completo, que é informação interna).

- **Autenticação**: não requerida.
- **Response `200 OK`**:
  ```json
  {
    "name": "Padaria do João",
    "slug": "padaria-do-joao",
    "description": "Padaria de bairro"
  }
  ```
- **Erros possíveis**:
  - `404` — slug não existe.

### `POST /api/public/companies/{slug}/conversations/`

Inicia uma nova conversa no canal da empresa.

- **Autenticação**: não requerida.
- **Request**: `{}` (ou opcionalmente `{"customer_identifier": "Ana"}`)
- **Response `201 Created`**:
  ```json
  { "id": "c9de...", "company": "a1c2...", "status": "OPEN", "created_at": "..." }
  ```

### `GET /api/conversations/{id}/messages/`

Lista as mensagens de uma conversa, em ordem cronológica.

- **Autenticação**: não requerida (a posse da conversa é validada pelo `id`, que é um
  UUID não adivinhável — suficiente para o MVP; ver nota de segurança abaixo).
- **Response `200 OK`**:
  ```json
  [
    { "id": "m1...", "sender": "CUSTOMER", "content": "Vocês entregam aos sábados?", "created_at": "..." },
    { "id": "m2...", "sender": "AI", "content": "Sim! Entregamos de segunda a sábado...", "created_at": "..." }
  ]
  ```

### `POST /api/conversations/{id}/messages/`

Valida e persiste uma mensagem do cliente e, em seguida, gera e persiste a
resposta automática da IA (usando `ai_context` da empresa e o histórico recente
da conversa como contexto). O campo `sender` é ignorado caso seja enviado e o
backend sempre salva a mensagem recebida como `CUSTOMER`.

- **Autenticação**: não requerida (mesma nota acima).
- **Request**:
  ```json
  { "content": "Vocês entregam aos sábados?" }
  ```
- **Response `201 Created`** (sucesso — IA respondeu): a mensagem do cliente
  persistida (`id`, `sender`, `content`, `created_at`). A resposta da IA **não**
  vem neste payload — o frontend deve buscá-la com um novo
  `GET /api/conversations/{id}/messages/` logo em seguida.
- **Response `502 Bad Gateway`** (a mensagem do cliente foi salva, mas o
  provider de IA falhou):
  ```json
  {
    "detail": "Mensagem recebida, mas não foi possível gerar a resposta automática.",
    "customer_message": { "id": "m1...", "sender": "CUSTOMER", "content": "...", "created_at": "..." },
    "ai_response_created": false
  }
  ```
- **Erros possíveis**:
  - `400` — mensagem vazia.
  - `404` — conversa não existe.
  - `502` — provider de IA indisponível (ver acima; a mensagem do cliente não é perdida).

> **Nota de segurança a evoluir**: usar o UUID da conversa como único controle de
> acesso é aceitável para um MVP (UUIDs não são adivinháveis por força bruta), mas
> não é autenticação de verdade. Se o produto evoluir para expor dados sensíveis por
> conversa, isso deve ser revisado (ex.: assinar a conversa com um token de sessão).

---

## Painel da empresa (conversas)

### `GET /api/companies/{company_id}/conversations/`

Lista as conversas recebidas por uma empresa, da mais recentemente atualizada
para a mais antiga segundo updated_at. O envio de mensagens nao atualiza esse campo; a ordenacao nao equivale necessariamente a ultima mensagem.

- **Autenticação**: requerida (apenas o dono da empresa).
- **Response `200 OK`**:
  ```json
  [
    {
      "id": "c9de...",
      "customer_identifier": "Ana",
      "status": "OPEN",
      "created_at": "...",
      "updated_at": "...",
      "last_message": { "sender": "AI", "content": "Sim! Entregamos...", "created_at": "..." },
      "messages_count": 4
    }
  ]
  ```
  `last_message` é `null` quando a conversa ainda não tem nenhuma mensagem.
- **Erros possíveis**:
  - `401` — sem autenticação.
  - `404` — empresa não existe ou não pertence ao usuário autenticado (mesmo
    padrão de `GET /api/companies/{id}/`: a API não revela a existência de
    recursos de outro proprietário).

### `PATCH /api/conversations/{id}/status/`

Marca uma conversa como resolvida ou reabre uma conversa encerrada. CLOSED nao bloqueia novos envios no endpoint publico.

- **Autenticação**: requerida (apenas o dono da empresa dona da conversa).
- **Request**:
  ```json
  { "status": "CLOSED" }
  ```
- **Response `200 OK`**: `{ "id": "c9de...", "status": "CLOSED" }`
- **Erros possíveis**:
  - `400` — valor de `status` inválido (só `OPEN` ou `CLOSED`).
  - `401` — sem autenticação.
  - `404` — conversa não existe ou não pertence a uma empresa do usuário autenticado.

---

## Resumo de autenticação por endpoint

| Endpoint | Autenticação |
|---|---|
| `POST /api/auth/register/` | Não |
| `POST /api/auth/login/` | Não |
| `GET/POST /api/companies/` | Sim (Token) |
| `GET/PATCH /api/companies/{id}/` | Sim (Token, apenas dono) |
| `GET /api/companies/{id}/conversations/` | Sim (Token, apenas dono) |
| `PATCH /api/conversations/{id}/status/` | Sim (Token, apenas dono da empresa) |
| `GET /api/public/companies/{slug}/` | Não |
| `POST /api/public/companies/{slug}/conversations/` | Não |
| `GET/POST /api/conversations/{id}/messages/` | Não |

## Campos e limites adicionais

O serializer privado de empresa retorna id, name, slug, description, ai_context,
created_at e updated_at; exemplos acima podem omitir campos para brevidade.
A criacao de conversa tambem retorna customer_identifier. Nao ha paginacao
configurada. O contexto de geracao inclui ate 20 mensagens anteriores.
