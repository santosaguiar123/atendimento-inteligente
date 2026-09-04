"""
Ponto único de acesso à camada de IA para o resto do sistema (ex.: a view de
mensagens em conversations/views.py).

Nenhuma outra parte do sistema deve importar de `ai.providers` diretamente —
sempre passar por `get_ai_response()` aqui. Isso mantém a troca de provider
centralizada em um único lugar (ver docs/architecture.md, seção 6).
"""
import os

from .providers.base import AIProvider
from .providers.stub import StubAIProvider


def _build_provider() -> AIProvider:
    """
    Seleciona o provider a partir da variável de ambiente AI_PROVIDER.

    Hoje só existe "stub". Quando você implementar um provider real (Fase 7),
    adicione um novo branch aqui — por exemplo:

        if provider_name == "openai":
            from .providers.openai import OpenAIProvider
            return OpenAIProvider()
    """
    provider_name = os.environ.get("AI_PROVIDER", "stub")

    if provider_name == "stub":
        return StubAIProvider()

    raise ValueError(f"AI_PROVIDER desconhecido: '{provider_name}'. Providers disponíveis: stub.")


def get_ai_response(*, company_context: str, conversation_history: list[dict], user_message: str) -> str:
    """Função de conveniência usada pelas views — esconde a escolha de provider."""
    provider = _build_provider()
    return provider.generate_response(
        company_context=company_context,
        conversation_history=conversation_history,
        user_message=user_message,
    )
