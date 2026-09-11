# Arquitetura

## 1. Visão geral

Monólito modular com backend Django/DRF, frontend React e PostgreSQL.
As requisições de geração são síncronas; não há fila, WebSocket, Celery ou Redis.

| Ambiente | Frontend | Backend | Banco |
|---|---|---|---|
| Desenvolvimento | Vite em 5173 | runserver em 8000 | PostgreSQL em 5432 |
| Produção local | Nginx em 8080, build React | Gunicorn interno em 8000 | PostgreSQL interno em 5432 |

Em desenvolvimento, o navegador usa a URL de VITE_API_URL e o backend permite
a origem CORS configurada. Em produção, o navegador acessa /api na mesma origem;
Nginx encaminha para Gunicorn. Os estáticos Django são compartilhados por volume.

## 2. Componentes

| Componente | Responsabilidade |
|---|---|
| users | usuário por email, registro, login e ping |
| companies | criação, consulta e edição por dono; consulta pública por slug |
| conversations | conversa anônima, mensagens, listagem privada e status |
| ai | seleção do provider e integração externa |
| React | autenticação local, páginas, painel e canal público |
| PostgreSQL | persistência dos dados |
| Nginx | arquivos compilados, estáticos Django e proxy da API/Admin |

## 3. Fronteiras

Somente o backend acessa PostgreSQL e OpenRouter. O navegador não recebe as chaves
do servidor. Autenticação administrativa usa Token do DRF; a autorização privada
é aplicada nos querysets. A representação pública da empresa omite ai_context
e owner. O acesso público às mensagens depende do UUID da conversa.

## 4. Fluxo de mensagens

1. O cliente abre /atendimento/:slug; a página busca os dados públicos.
2. Cria uma conversa ou restaura o UUID salvo no localStorage por empresa.
3. Envia content para POST /api/conversations/{id}/messages/.
4. O serializer valida o texto e o backend persiste CUSTOMER.
5. A view reúne até 20 mensagens anteriores e o ai_context da empresa.
6. ai.services.get_ai_response seleciona stub ou OpenRouter e gera o texto.
7. O backend persiste AI e retorna a mensagem CUSTOMER com HTTP 201.
8. O frontend consulta GET de mensagens para mostrar o histórico atualizado.

Em falha do provider, o endpoint retorna 502 com customer_message e
ai_response_created=false. A mensagem recebida continua gravada; a operação
inteira não é uma transação atômica. Não há reenvio idempotente.
A tela pública mostra o erro, mas não recarrega automaticamente a lista no 502.

## 5. Estado administrativo

O painel lista empresas do usuário e conversas da empresa selecionada, consulta
mensagens e alterna OPEN/CLOSED. A lista usa -updated_at da conversa; o envio de
mensagens não atualiza esse campo, portanto não representa necessariamente a
ordem da última mensagem. A atualização do painel depende de novas consultas,
sem recebimento em tempo real. CLOSED não bloqueia mensagens públicas.

## 6. Integração com IA

AIProvider define a interface e ai.services é a entrada comum.
StubAIProvider fornece uma resposta simulada; OpenRouterProvider usa o cliente
compatível OpenAI para acessar https://openrouter.ai/api/v1.

O provider recebe contexto da empresa, histórico e mensagem atual. O modelo
padrão é openrouter/free; o código também aceita nomes terminados em :free.
Contexto vazio usa uma instrução de ausência de informações adicionais.
Timeout e limite de tokens vêm do ambiente. Veja [OpenRouter](openrouter.md).

## 7. Configuração

settings.py lê variáveis de ambiente. DEBUG é False por padrão; chave é
obrigatória; produção exige hosts explícitos e senha do banco.
O Compose de produção fixa DEBUG=False, conexão interna ao banco e mesma origem.
Gunicorn executa sem root; collectstatic precede o servidor.
Detalhes operacionais em [Produção](../PRODUCTION.md).

## 8. Limitações

Sem paginação do histórico, limitação de chamadas, autorização forte da sessão
pública, backups automáticos ou implantação pública configurada.
A listagem de conversas calcula preview e contagem com consultas adicionais.
Essas melhorias estão no [Roadmap](roadmap.md).