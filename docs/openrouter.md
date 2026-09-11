# Respostas automáticas e OpenRouter

## Modos de execução

| Modo | Configuração | Chave externa |
|---|---|---|
| Simulado | AI_PROVIDER=stub | dispensada |
| Real | AI_PROVIDER=openrouter | OPENROUTER_API_KEY no backend |

Preencher a chave mantendo AI_PROVIDER=stub não ativa o provedor real.
O stub permite testar telas, persistência e fluxo completo sem acesso externo.

## Configuração

Obtenha uma chave na [conta OpenRouter](https://openrouter.ai/settings/keys).
Configure no arquivo de ambiente usado pelo Compose:

- AI_PROVIDER=openrouter
- OPENROUTER_API_KEY: chave da conta.
- OPENROUTER_MODEL=openrouter/free, padrão; o código também aceita sufixo :free.
- OPENROUTER_MAX_TOKENS=350, limite de saída por resposta.
- OPENROUTER_TIMEOUT_SECONDS=45, timeout configurado no cliente.
- OPENROUTER_SITE_URL: URL da aplicação, usada no header HTTP-Referer.

Recrie o backend após a alteração. Desenvolvimento:

```bash
docker compose up -d --force-recreate backend
```

Produção:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d backend
```

## Comportamento

O backend envia contexto da empresa, até 20 mensagens anteriores e a mensagem
atual ao provedor. A resposta é persistida como AI. O cliente não acessa
diretamente OpenRouter e não recebe a chave.

O código rejeita modelos sem o nome padrão/sufixo permitido, mas a disponibilidade
e os limites do serviço devem ser conferidos na conta e documentação do provedor.
Há até duas retentativas do SDK; o tempo total de uma falha pode ultrapassar o
timeout de uma tentativa e os 120 segundos padrão do Gunicorn/proxy.
Falhas retornam 502, preservando a mensagem do cliente.

## Demonstração e deploy

Não é necessário deploy para testar respostas reais no próprio computador.
Quem clona pode usar sua própria chave ou o stub.
Para testar apenas por um link, publique a aplicação e configure a chave
no servidor. Visitantes utilizam essa instância sem receber credenciais;
as chamadas compartilham os limites da conta configurada.

As verificações automatizadas usam mocks e não chamam o provedor real.