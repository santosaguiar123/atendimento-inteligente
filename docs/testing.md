# Testes e validação

Validacao em 2026-09-10, via Docker Compose e PostgreSQL:

- `docker compose exec backend python manage.py test`: 44 testes, OK (30.208s).
- `docker compose exec backend python manage.py check`: nenhum problema (0 silenced).
- `docker compose exec backend python check_owner_isolation.py`: tres falhas de assertion esperadas; mutacao detectada.

## Requisitos

| Requisito | Evidencia principal |
| --- | --- |
| RF01 — registro | users.tests.AuthenticationAPITests: sucesso, email duplicado, resposta sem senha e verificacao do hash |
| RF02 — login/token | AuthenticationAPITests: sucesso e senha errada; EndToEndAPITests usa o token retornado em uma requisicao autenticada |
| RF03 — cadastro de empresa | CompanyAPITests.test_create_ignores_owner_from_request_body e fluxo completo |
| RF04 — visualizar/editar propria empresa | CompanyAPITests.test_owner_can_retrieve_and_edit_company |
| RF05 — canal publico | CompanyAPITests.test_public_detail_exposes_only_public_fields e fluxo anonimo completo |
| RF06 — iniciar conversa | PublicConversationAPITests.test_create_conversation_with_valid_company_slug |
| RF07 — enviar mensagens | PublicConversationAPITests e EndToEndAPITests: envio, remetente forjado, ordenacao e conteudo vazio/ausente/nulo |
| RF08 — IA com contexto | test_customer_message_generates_and_persists_ai_response; AIServiceTests; OpenRouterProviderTests; fluxo completo com mock |
| RF09 — persistencia | PersistenceModelTests: relacionamentos, UUIDs, defaults e cascata; fluxo completo consulta dados persistidos |
| RF10 — isolamento por dono | CompanyAPITests: listagem, consulta e edicao; prova de mutacao em check_owner_isolation.py |

Todos os requisitos RF01–RF10 possuem cobertura automatizada no backend.
O fluxo ponta a ponta usa o cliente HTTP de testes do DRF e o banco de testes;
nao automatiza o navegador/frontend.

## Independencia da IA real

Os testes de envio valido usam patch de `conversations.views.ai_services.get_ai_response`.
Os testes do OpenRouter substituem o cliente `OpenAI` por mock; os testes de
validacao da configuracao falham antes de construir o cliente. O teste do stub
seleciona explicitamente `AI_PROVIDER=stub`. A configuracao numerica e o modelo
usados nos testes do OpenRouter sao definidos pelos testes, sem depender do `.env`.
O traceback `provider indisponivel` da suite e intencional: o teste verifica o
retorno 502 e a preservacao da mensagem do cliente quando a IA falha.

## Prova de isolamento

`check_owner_isolation.py` substitui temporariamente os querysets de listagem e
detalhe por `Company.objects.all()` e executa os mesmos tres testes de isolamento.
A listagem passa a expor a outra empresa e GET/PATCH retornam 200 em vez de 404.
As tres assertions falham, comprovando a deteccao da regressao. Os patches sao
restritos ao processo; os filtros no codigo de producao permanecem intactos.

## Frontend e produção

Após a atualização das dependências em 10/09/2026, npm audit retornou zero alertas
reportados e npm run build e npm run lint passaram. A auditoria detalhada está em
[Segurança](security-guide.md). Não há suíte permanente de testes de navegador no projeto.

Comandos de desenvolvimento:

```bash
docker compose exec frontend npm audit
docker compose exec frontend npm run build
docker compose exec frontend npm run lint
docker compose exec backend python manage.py makemigrations --check --dry-run
```

Para testar o backend da imagem de produção:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend python manage.py check
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend python manage.py test
```

A suíte usa um banco de testes próprio; o usuário precisa de permissão para
criá-lo. O usuário inicial do container PostgreSQL tem essa permissão.
O ping confirma disponibilidade HTTP; ele não testa OpenRouter nem banco.
Build/HTTP não comprovam sozinhos o fluxo interativo completo no navegador.
O teste real do provedor deve ser feito separadamente com uma empresa de teste.

## Verificação de navegação após atualização

Em 10/09/2026, Edge headless executou um teste temporário nas portas 5173 e 8080:
cadastro renderizado, dashboard anônimo redirecionado ao login, login navega para
o painel, painel recarrega com sessão, canal público inicia conversa, envia e
restaura mensagens após recarga. Nenhum erro JavaScript de página foi registrado.
A API foi simulada nesse teste para isolar a regressão de React Router; não houve
chamada ao OpenRouter nem criação de contas no banco. O ping HTTP real de produção
retornou 200. A suíte backend passou novamente com 44 testes, sem migrations novas.
