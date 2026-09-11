# Segurança e dependências

## Auditoria do frontend — 10/09/2026

A auditoria anterior reportava quatro pacotes afetados (três moderados e um alto).
Não eram quatro problemas independentes: react-router-dom herdava os alertas de
react-router, e Vite também herdava o alerta de esbuild.

| Pacote | Severidade anterior | Problema reportado | Correção |
|---|---|---|---|
| vite | alta | contorno de restrições de arquivos em caminhos Windows; traversal em sourcemaps; exposição NTLMv2 pelo launch-editor | 7.3.6 |
| esbuild | moderada | site externo podia consultar o servidor de desenvolvimento e ler respostas | dependência transitiva atualizada pelo Vite |
| react-router | moderada | redirecionamento externo com barra invertida; injeção de construtor na hidratação SSR | 7.18.3 |
| react-router-dom | moderada | herdava os problemas de react-router | 7.18.3 |

O plugin React foi atualizado para 5.2.0 e os containers do frontend usam Node 22.
As versões resolvidas estão em frontend/package-lock.json. Após a atualização,
`npm audit` retornou zero vulnerabilidades reportadas. Isso descreve a base de
avisos consultada nessa data, não uma garantia de ausência de qualquer falha.

As falhas do servidor Vite/esbuild afetam ferramentas de desenvolvimento; a imagem
final de produção serve arquivos com Nginx. O projeto usa rotas React no navegador,
sem hidratação SSR. Mesmo assim, as dependências foram corrigidas nos dois ambientes.

Avisos consultados:

- [Vite: restrições de arquivos no Windows](https://github.com/advisories/GHSA-fx2h-pf6j-xcff)
- [Vite: traversal em sourcemaps](https://github.com/advisories/GHSA-4w7w-66w2-5vf9)
- [launch-editor: exposição NTLMv2](https://github.com/advisories/GHSA-v6wh-96g9-6wx3)
- [esbuild: servidor de desenvolvimento](https://github.com/advisories/GHSA-67mh-4wv8-2f99)
- [React Router: redirecionamento](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6)
- [React Router: hidratação SSR](https://github.com/advisories/GHSA-337j-9hxr-rhxg)

## Configuração e limites atuais

- `.env` e `.env.production` são ignorados pelo Git e não entram nas imagens.
- Django exige chave por ambiente; produção exige hosts explícitos e senha do banco.
- A senha inicial do PostgreSQL só é aplicada quando o volume está vazio.
- O frontend não recebe a chave OpenRouter; as chamadas saem do backend.
- Tokens administrativos ficam no localStorage. Logout remove a cópia local,
  mas não revoga o token no backend; não há expiração automática configurada.
- Endpoints privados filtram recursos pelo dono. Mensagens públicas dependem
  apenas do UUID da conversa, sem autorização adicional.
- Não há rate limiting nem limite de tamanho de histórico retornado pela API.
- HTTPS, cookies seguros, confiança no proxy, backup e monitoramento de produção
  ainda precisam ser configurados na etapa de deploy.
- A auditoria aqui cobre npm. As dependências Python não foram atualizadas por
  esta correção; revisão de suporte e vulnerabilidades backend segue pendente.
