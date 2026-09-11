# Produção

## Preparar o ambiente

Esta configuração executa as imagens de produção localmente. Publicar na internet
exige uma plataforma/servidor, domínio ou URL pública e HTTPS.

Copie `.env.example` para `.env.production` apenas se o destino ainda não existir.
Configure:

| Variável | Valor a configurar |
|---|---|
| `DJANGO_SECRET_KEY` | chave privada própria da instalação |
| `POSTGRES_PASSWORD` | senha forte própria do usuário do banco |
| `POSTGRES_DB`, `POSTGRES_USER` | nome do banco e usuário; podem manter os nomes do exemplo |
| `DJANGO_DEBUG` | `False` |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1` no ensaio; domínio real no deploy, sem protocolo/porta |
| `AI_PROVIDER` | `stub` para simulação ou `openrouter` para respostas reais |
| `OPENROUTER_API_KEY` | chave da conta OpenRouter, obrigatória somente com `openrouter` |
| `OPENROUTER_MODEL` | `openrouter/free` ou um modelo aceito com sufixo `:free` |
| `OPENROUTER_SITE_URL` | `http://localhost:8080` no ensaio ou URL pública no deploy |

Os três segredos têm finalidades diferentes: a chave Django assina dados da
aplicação, a senha PostgreSQL autentica a conexão ao banco, e a chave OpenRouter
autoriza chamadas ao provedor. Não use o mesmo valor para eles.

O Compose força `DEBUG=False`, `POSTGRES_HOST=db` e `POSTGRES_PORT=5432`.
O frontend é compilado com `VITE_API_URL=/api`; CORS fica vazio porque API e
frontend compartilham a origem. Não é necessário adaptar essas variáveis locais
do exemplo para usar este Compose.

## Construir e iniciar

Na raiz do projeto:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml config --quiet
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm backend python manage.py migrate --noinput
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --wait
```

Acesse http://localhost:8080. O ping em
http://localhost:8080/api/auth/ping/ deve retornar:

```json
{"status":"ok","service":"atendimento-inteligente-backend"}
```

Crie a conta pelo frontend; para acessar o Django Admin, crie um superusuário:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

## Banco e volumes

Não é necessário instalar PostgreSQL no computador. O serviço `db` usa a imagem
`postgres:16-alpine`. Em um volume vazio, `POSTGRES_PASSWORD` define a senha
inicial do usuário; uma senha forte escolhida por você é suficiente.

Se o banco já foi inicializado, alterar `.env.production` não altera sua senha.
Para trocar a senha sem perder dados, conecte-se com a credencial atual e use
o comando interativo `\password` no psql, depois atualize o arquivo de ambiente
e recrie o backend. Não remova o volume para resolver um erro de autenticação.

O projeto Compose é `atendimento-prod`. Os volumes `postgres_data` e
`staticfiles` recebem esse prefixo e são separados dos volumes de desenvolvimento.
Não use o mesmo `-p` ou `COMPOSE_PROJECT_NAME` nos dois ambientes.

Um ensaio anterior pode ter criado esse banco com o `.env` de desenvolvimento.
Se usar agora uma senha diferente em `.env.production`, será necessário alinhar
a senha do banco existente. O ping verifica o processo HTTP, não a conexão ao banco;
as migrations e operações da aplicação também precisam passar.

## Execução e estáticos

- Backend: `backend/Dockerfile.prod`, dependências de `requirements-prod.txt`,
  usuário sem privilégios, Gunicorn com dois workers por padrão.
- Frontend: `frontend/Dockerfile.prod`, `npm ci` e `npm run build` em Node 22;
  a imagem final contém Nginx e os arquivos compilados.
- `collectstatic --noinput` roda antes do Gunicorn. `STATIC_ROOT=/app/staticfiles`
  é montado no Nginx somente para leitura.
- Nginx serve `/`, fallback das rotas React, `/static/` e encaminha
  `/api/` e `/admin/` para o backend.
- Migrations são explícitas; execute-as nas atualizações de schema.
- `.env` e suas variantes são ignorados pelo Git e pelos contextos de build.
  Chaves não devem entrar em variáveis `VITE_*`, que são públicas no navegador.

## Atualizações, diagnóstico e parada

Após alterar variáveis, execute novamente `up -d`: Compose recria os serviços
cuja configuração mudou. Após alterar código/dependências, refaça o build,
aplique migrations quando necessário e execute `up -d --wait`.

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=50 backend
docker compose --env-file .env.production -f docker-compose.prod.yml down
```

`down` preserva os dados; `down -v` os remove. Evite compartilhar a saída de
`config` sem `--quiet`, pois ela contém variáveis expandidas.

## Publicação

A escuta padrão é `127.0.0.1:8080`; banco e backend não publicam portas.
Ajuste `PROD_BIND_ADDRESS` e `PROD_HTTP_PORT` conforme a infraestrutura.
O Compose atual não configura TLS nem confiança em headers de protocolo.
Configure HTTPS, encaminhamento de protocolo, cookies seguros e redirecionamento
na infraestrutura e no Django antes da publicação.

Defina também backup/restauração do banco, limites de uso do canal público e
monitoramento. O projeto ainda tem limitações descritas em
[Segurança](docs/security.md). Publicar a instância permite que visitantes usem
o produto sem instalar ferramentas nem possuir chave OpenRouter.

## Validação local

Em 10/09/2026: imagens construídas, migrations aplicadas no banco isolado, serviços
iniciados com `up -d --wait`, checks Django e 44 testes aprovados.
Ping, frontend, login, Admin e CSS estático responderam HTTP 200.
Ausência de chave Django, hosts ou senha bloqueou a configuração de produção;
DEBUG permaneceu False sem variável definida. Esses testes usaram as credenciais
locais já existentes, sem configurar credenciais definitivas de publicação.

Veja [Testes](docs/testing.md) e [Segurança](docs/security.md) para a validação
das dependências atualizadas.

Apos atualizar o frontend: auditoria npm sem alertas, build e lint aprovados;
navegacao validada em Edge headless nas portas 5173/8080 com API simulada.
O ping HTTP real permaneceu em 200. Configuracoes definitivas de publicacao
nao foram aplicadas ao ambiente de ensaio.
