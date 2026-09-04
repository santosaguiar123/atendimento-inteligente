"""
Views do app conversations.

TODO (Fases 5 e 7 do roadmap — ver docs/roadmap.md):
Implementar aqui os endpoints descritos em docs/api.md ("Canal público de
atendimento"):

    POST /api/public/companies/{slug}/conversations/  -> criar conversa
    GET  /api/conversations/{id}/messages/             -> listar mensagens
    POST /api/conversations/{id}/messages/             -> enviar mensagem do
                                                           cliente e obter resposta
                                                           da IA (ver ai/services.py)

Fluxo esperado ao criar uma mensagem (ver docs/architecture.md, seção 4):
1. Validar e salvar a mensagem do cliente (sender=CUSTOMER).
2. Montar o contexto (Company.ai_context + histórico recente da conversa).
3. Chamar `ai.services.get_ai_response(...)`.
4. Salvar a resposta como uma nova Message (sender=AI).
5. Retornar ambas (ou a resposta da IA) na response.
"""
