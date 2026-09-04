"""
Views do app companies.

TODO (Fase 4 do roadmap — ver docs/roadmap.md):
Implementar aqui os endpoints descritos em docs/api.md ("Empresas"):

    GET/POST   /api/companies/           -> listar/criar empresas do usuário logado
    GET/PATCH  /api/companies/{id}/      -> detalhar/editar (somente o dono)
    GET        /api/public/companies/{slug}/ -> dado público, sem autenticação

Pontos a estudar e decidir durante a implementação:
- Usar `ModelViewSet` (mais rápido de escrever) ou views separadas por endpoint
  (mais explícito, melhor para aprender o que o DRF faz por baixo dos panos)?
  Para este projeto, recomendamos começar com views explícitas na Fase 4 e migrar
  para ViewSet depois, se fizer sentido — assim você entende o que está por trás
  da "mágica" antes de usá-la.
- Toda queryset de empresa deve ser filtrada por `owner=request.user` — nunca
  retornar empresas de outros administradores (RF10 em docs/requirements.md).
"""
