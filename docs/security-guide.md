# Segurança

Este documento registra as proteções que já fazem parte do projeto e o que deve
ser resolvido antes de uma publicação aberta ao público. Ele retrata o estado do
código em 11/09/2026; não substitui uma auditoria de segurança.

## O que já está protegido

- Os arquivos `.env` e `.env.production` não são versionados nem copiados para as
  imagens Docker. A chave do OpenRouter fica somente no backend.
- Em produção, o Django recusa a inicialização sem `DJANGO_SECRET_KEY`, senha do
  PostgreSQL e uma lista explícita de hosts. `DJANGO_DEBUG` é forçado para `False`.
- As rotas administrativas exigem token e filtram empresas e conversas pelo dono.
  A suíte de testes cobre tentativas de leitura e edição entre contas diferentes.
- O campo `sender` enviado pelo cliente é ignorado; mensagens recebidas pelo canal
  público são sempre gravadas como mensagens do cliente.
- A imagem de produção entrega o frontend compilado pelo Nginx. Vite e seu servidor
  de desenvolvimento não ficam expostos nesse ambiente.

## Antes de colocar na internet

O Compose de produção está pronto para um ensaio local, mas uma instância pública
precisa de algumas camadas adicionais:

1. Terminar o HTTPS no proxy ou na plataforma e configurar corretamente os headers
   encaminhados ao Django.
2. Adicionar limites de requisição e de tamanho de entrada, principalmente no canal
   público e nos endpoints que acionam o provedor de IA.
3. Definir backup do PostgreSQL, testar restauração e configurar monitoramento de
   erros e indisponibilidade.
4. Revisar as dependências Python com uma ferramenta de auditoria antes do deploy.
5. Trocar todos os valores de exemplo, restringir `DJANGO_ALLOWED_HOSTS` ao domínio
   real e manter segredos no gerenciador da plataforma.

Dois limites merecem atenção especial. O identificador UUID permite retomar uma
conversa pública, mas qualquer pessoa que obtenha esse link consegue consultar e
enviar mensagens nessa conversa. Além disso, o token administrativo fica no
`localStorage`; o logout apaga o token do navegador, mas não o revoga no servidor
e atualmente não existe expiração automática. Essas escolhas são aceitáveis para
a demonstração do MVP, não para dados sensíveis ou uso público sem supervisão.

## Dependências do frontend

Em 10/09/2026, Vite, esbuild e React Router foram atualizados para eliminar os
alertas presentes na instalação anterior. Depois da atualização, `npm audit`
retornou zero vulnerabilidades conhecidas, e `npm run build` e `npm run lint`
foram concluídos com sucesso. As versões exatas ficam registradas em
`frontend/package-lock.json`. Build, lint e auditoria foram repetidos com o mesmo
resultado em 11/09/2026.

Os avisos que motivaram a atualização estão nos seguintes registros:

- [Vite: restrições de arquivos no Windows](https://github.com/advisories/GHSA-fx2h-pf6j-xcff)
- [Vite: traversal em sourcemaps](https://github.com/advisories/GHSA-4w7w-66w2-5vf9)
- [launch-editor: exposição NTLMv2](https://github.com/advisories/GHSA-v6wh-96g9-6wx3)
- [esbuild: servidor de desenvolvimento](https://github.com/advisories/GHSA-67mh-4wv8-2f99)
- [React Router: redirecionamento](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6)
- [React Router: hidratação SSR](https://github.com/advisories/GHSA-337j-9hxr-rhxg)

Uma auditoria sem alertas significa apenas que a base consultada não encontrou
problemas conhecidos naquele momento. Vale repetir `npm audit` e a revisão das
dependências Python sempre que o projeto for atualizado e imediatamente antes do
deploy.
