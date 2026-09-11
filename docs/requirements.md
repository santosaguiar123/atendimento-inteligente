# Requisitos — Atendimento Inteligente

## 1. Problema

Pequenas e médias empresas recebem, todos os dias, perguntas repetitivas de clientes
(horário de funcionamento, formas de pagamento, prazos, políticas, dúvidas sobre
produtos/serviços). Responder isso manualmente consome tempo da equipe e gera
atendimento inconsistente — a resposta depende de quem está de plantão.

A plataforma resolve isso oferecendo um canal de atendimento automatizado: a empresa
cadastra informações sobre o próprio negócio uma única vez, e um assistente de IA usa
esse contexto para responder aos clientes de forma consistente, disponível a qualquer
hora, sem que um humano precise estar presente em cada conversa.

Não é objetivo do projeto **substituir** atendimento humano de forma definitiva — é
automatizar a camada de perguntas frequentes/contextuais, deixando espaço para isso
evoluir futuramente para um modelo híbrido (IA + humano).

## 2. Público-alvo

Dois tipos de usuário no MVP:

- **Administrador da empresa** — dona/o de um pequeno negócio ou responsável pelo
  atendimento, que quer configurar um canal de IA sem depender de um time de TI.
- **Cliente final** — pessoa que acessa o canal de atendimento da empresa para tirar
  uma dúvida, sem precisar criar conta.

## 3. Personas e responsabilidades

### Administrador (usuário autenticado)
- Cria uma conta e faz login na plataforma.
- Cadastra sua empresa (nome, descrição, informações de contexto para a IA).
- Consegue ver/editar as informações da própria empresa.
- Acompanha conversas no painel e marca como resolvidas ou reabertas.

### Cliente final (usuário não autenticado / anônimo)
- Acessa o canal de atendimento público de uma empresa específica.
- Inicia uma conversa e troca mensagens com a IA.
- Não precisa se cadastrar para conversar no MVP (reduz fricção — é o cenário mais
  realista para um canal de atendimento público).

> Nota de design: o cliente final **não é** um `User` do Django no MVP. Ele é
> identificado apenas pela conversa que cria (ver `docs/database.md`). Isso evita
> construir um sistema de contas de cliente antes de validar o fluxo principal.

## 4. Requisitos funcionais (MVP)

| ID | Descrição |
|----|-----------|
| RF01 | O sistema deve permitir que um administrador crie uma conta (registro). |
| RF02 | O sistema deve permitir que um administrador faça login e receba um token de autenticação. |
| RF03 | O sistema deve permitir que um administrador autenticado cadastre uma empresa vinculada à sua conta. |
| RF04 | O sistema deve permitir que o administrador visualize e edite os dados da própria empresa. |
| RF05 | O sistema deve expor um canal público de atendimento por empresa (identificado por um slug/ID público). |
| RF06 | O sistema deve permitir que um cliente inicie uma conversa nesse canal. |
| RF07 | O sistema deve permitir que o cliente envie mensagens dentro de uma conversa. |
| RF08 | O sistema deve gerar uma resposta automática usando as informações da empresa como contexto, através de um serviço de IA (provider stub ou OpenRouter, selecionado por ambiente). |
| RF09 | O sistema deve persistir empresas, conversas e mensagens no banco de dados. |
| RF10 | O sistema deve impedir que um administrador veja ou edite empresas de outros administradores. |

## 5. Requisitos não funcionais (MVP)

| ID | Categoria | Descrição |
|----|-----------|-----------|
| RNF01 | Segurança | Senhas armazenadas com hash (padrão do Django); autenticação via token; segredos fora do código-fonte (`.env`). |
| RNF02 | Desempenho | Resposta da API em tempo aceitável para uso interativo (não há meta de SLA formal no MVP — é um projeto de aprendizado). |
| RNF03 | Manutenibilidade | Backend organizado em apps Django por domínio; frontend organizado por responsabilidade (páginas, componentes, serviços). |
| RNF04 | Escalabilidade básica | Banco relacional com chaves estrangeiras e índices nos campos mais consultados; camada de IA desacoplada por trás de uma interface, permitindo trocar de provider sem reescrever o domínio. |
| RNF05 | Disponibilidade | Ambiente local reprodutível via Docker Compose; não há requisito de alta disponibilidade no MVP. |
| RNF06 | Organização/DX | `docker compose up` deve subir backend, frontend e banco de forma consistente entre máquinas diferentes. |

Propositalmente **não** há requisitos de: multi-idioma, LGPD/compliance formal,
observabilidade avançada, rate limiting sofisticado, SSO, etc. Podem entrar em fases
futuras (ver `roadmap.md`), mas não fazem parte do MVP.

## 6. Escopo do MVP

### Entra no MVP
- Cadastro/login de administrador (autenticação por token).
- CRUD básico de empresa (create/read/update) vinculado ao administrador dono.
- Canal público de atendimento por empresa.
- Criação de conversa + envio/recebimento de mensagens.
- Integração com respostas simuladas (stub) ou reais (OpenRouter), selecionadas por ambiente.
- Persistência de tudo em PostgreSQL.
- Containerização com Docker Compose.

### Fica fora do MVP (mas está no roadmap)
- Atendentes humanos e transferência IA → humano.
- Dashboard administrativo com analytics.
- Múltiplos administradores por empresa (times/permissões granulares).
- Histórico de conversas com busca/filtro avançado.
- Notificações (e-mail, push, etc.).
- Integrações externas (WhatsApp, Instagram, etc.).
- Rate limiting, billing, planos pagos.
- CI/CD e deploy em produção (fica para as fases finais do roadmap, depois que o MVP
  estiver funcional localmente).

### Critério de "pronto" para o MVP
O MVP está pronto quando: um administrador consegue se cadastrar, logar, cadastrar
uma empresa, e um cliente anônimo consegue abrir o canal dessa empresa, mandar uma
mensagem e receber uma resposta gerada a partir do contexto da empresa — tudo
persistido no banco e rodando via Docker Compose.

## Estado da implementacao

RF01–RF10 implementados e cobertos por testes backend. Painel de conversas e
configuracao de producao com Gunicorn/Nginx implementados. Deploy publico pendente.
Os testes usam mocks; nao verificam disponibilidade de modelos externos.
