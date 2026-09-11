# Contexto do projeto — Atendimento Inteligente / Resolvi

Atualizado em 11/09/2026. Resumo das decisões e do estado atual do projeto;
detalhes no README, em PRODUCTION.md e em docs/. Este arquivo é versionado.

## Estado atual

Funcionalidades das Fases 0–9 implementadas. Registro/login, cadastro e edição de
empresas, isolamento por dono, canal público, conversas, respostas automáticas,
painel, integração OpenRouter e configuração de produção estão presentes.
Deploy público, HTTPS e configuração da infraestrutura permanecem pendentes.

Backend com 44 testes automatizados. Os testes substituem o serviço externo por
mocks; não comprovam disponibilidade ou qualidade de um modelo real.
Frontend com build e lint; auditoria das dependências detalhada em
docs/security-guide.md.

## Stack e execução

Python 3.12, Django 5.0.6, DRF 3.15.2, PostgreSQL 16, React 18, TypeScript,
Vite 7.3.6, React Router DOM 7.18.3 e plugin React 5.2.0.
Node 22 nos Dockerfiles do frontend; package-lock.json versionado.

Desenvolvimento: docker-compose.yml, .env, runserver:8000, Vite:5173, banco:5432.
Produção local: docker-compose.prod.yml, .env.production, Gunicorn interno,
Nginx em 127.0.0.1:8080, banco e volumes próprios sob atendimento-prod.
O ensaio inicial de produção usou .env; trocar a senha no arquivo não altera
a senha já gravada no volume PostgreSQL.

## Contratos e invariantes

- User 1:N Company 1:N Conversation 1:N Message, com UUID e exclusão em cascata.
- Dados privados filtrados por owner=request.user; acesso de outro dono dá 404.
- Endpoint público de empresa retorna name, slug e description.
- POST de mensagem salva CUSTOMER; sender fornecido pelo cliente é ignorado.
- Histórico de até 20 mensagens anteriores e ai_context alimentam o provider.
- Sucesso salva AI e retorna apenas CUSTOMER (201); frontend faz GET em seguida.
- Falha do provider retorna 502 e preserva a mensagem do cliente.
- OPEN/CLOSED é estado administrativo; o endpoint público não bloqueia envio
  quando CLOSED. Não há envio manual HUMAN implementado.
- UUID da conversa permite ler/enviar mensagens sem login; não é autorização
  forte. Tokens administrativos ficam em localStorage; logout é local.

## Integração

ai.services.get_ai_response é a entrada para providers stub e openrouter.
AI_PROVIDER=stub não requer chave; openrouter exige OPENROUTER_API_KEY.
A chave é exclusiva do backend. O código aceita openrouter/free ou sufixo :free.
Timeout padrão por tentativa: 45 segundos; SDK com até duas retentativas.
Gunicorn e Nginx têm limites próprios; o tempo total pode superar 120 segundos
em falhas prolongadas. Ajustar a política antes de uso público contínuo.

## Próximos trabalhos

Deploy/HTTPS, backup, observabilidade, proteção contra abuso, autorização de
conversas e revisão de suporte/segurança das dependências backend.
Melhorias funcionais: atualização do painel, tratamento visual de 502,
ordenação por última mensagem e atendimento humano.

## Organização

README: entrada para execução e demonstração.
PRODUCTION: variáveis, volumes e comandos de produção.
docs/api.md: contrato HTTP; docs/database.md: schema.
docs/testing.md: cobertura; docs/security-guide.md: segurança e riscos conhecidos.
docs/openrouter.md: integração; docs/roadmap.md: pendências.

Preservar alterações locais, migrations aplicadas e volumes com dados.
Atualizar contratos e documentação junto de alterações no comportamento.
