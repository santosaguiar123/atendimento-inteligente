# Roadmap

Estado do código revisado em 10/09/2026. “Concluído” indica implementação local;
não significa publicação na internet nem disponibilidade de um provedor externo.

| Fase | Estado | Entrega |
|---|---|---|
| 0 — Planejamento | Concluída | requisitos, arquitetura e contratos |
| 1 — Setup | Concluída | backend, frontend e Compose de desenvolvimento |
| 2 — Banco | Concluída | models, migrations, relações e índices |
| 3 — Autenticação | Concluída | registro, login/token e proteção privada |
| 4 — Empresas | Concluída | criar, listar, consultar e editar por dono; canal público |
| 5 — Conversas | Concluída | mensagens CUSTOMER/AI, histórico e falha do provider |
| 6 — Frontend | Concluída | início, cadastro, login, dashboard e atendimento público |
| 7 — Integração | Concluída | stub/OpenRouter selecionados por ambiente |
| 8 — Testes | Concluída | 44 testes backend, mocks e prova de isolamento |
| 9 — Produção | Concluída localmente | Gunicorn, Nginx, build, estáticos e Compose separado |
| 10 — Deploy | Pendente | instância pública, HTTPS e operação |
| 11 — Evolução | Pendente | melhorias de produto e escala |

## Fase 10 — Publicação

- [ ] Escolher plataforma e provisionar aplicação e banco persistente.
- [ ] Configurar segredos, hosts e provider no ambiente de publicação.
- [ ] Alinhar domínio, HTTPS, proxy e configurações de segurança Django.
- [ ] Validar cadastro, login, empresa e resposta real na URL pública.
- [ ] Definir backup e testar restauração.
- [ ] Configurar logs, acompanhamento de falhas e limites de uso.
- [ ] Revisar dependências backend e limitações em [Segurança](security.md).

As quatro entradas da auditoria anterior do frontend foram tratadas com
atualização de Vite, esbuild e React Router. Veja [Segurança](security.md).

## Melhorias funcionais e técnicas

- [ ] Autorizar sessões públicas sem depender apenas do UUID da conversa.
- [ ] Aplicar limites de requisições e proteção contra abuso.
- [ ] Atualizar mensagens/painel automaticamente e ordenar por última mensagem.
- [ ] Recarregar histórico após 502 e definir idempotência de reenvio.
- [ ] Alinhar timeout total do provider com Gunicorn/proxy.
- [ ] Definir se CLOSED deve bloquear novos envios.
- [ ] Paginar conversas e mensagens; otimizar consultas de resumo.
- [ ] Adicionar testes de navegador contínuos e CI.
- [ ] Atendimento humano, equipes, notificações, analytics e integrações externas.

A suíte do backend verifica o fluxo com mocks. Uma demonstração de respostas
reais depende de configuração válida e disponibilidade do OpenRouter.