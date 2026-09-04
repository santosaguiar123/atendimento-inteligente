"""
Views do app users.

TODO (Fase 3 do roadmap): implementar as views de registro e login descritas em
docs/api.md:

    POST /api/auth/register/   -> cria um usuário (AllowAny)
    POST /api/auth/login/      -> autentica e retorna um Token (AllowAny)

Dica de implementação: para login, o DRF já oferece
`rest_framework.authtoken.views.ObtainAuthToken` como ponto de partida — vale
estudar o código-fonte dele antes de decidir se você o reusa ou escreve o seu.
"""
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class PingView(APIView):
    """
    Endpoint simples e já funcional, sem autenticação, útil para validar que o
    backend está de pé (ver README.md, seção 'Como executar localmente').
    """

    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "ok", "service": "atendimento-inteligente-backend"})
