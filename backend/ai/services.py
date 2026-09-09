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
    """Seleciona o provider configurado em AI_PROVIDER."""
    provider_name = os.environ.get("AI_PROVIDER", "stub").strip().lower()

    if provider_name == "stub":
        return StubAIProvider()

    if provider_name == "openrouter":
        from .providers.openrouter import OpenRouterProvider

        return OpenRouterProvider()

    raise ValueError(
        f"AI_PROVIDER desconhecido: '{provider_name}'. Providers disponíveis: stub, openrouter."
    )

def get_ai_response(*, company_context: str, conversation_history: list[dict], user_message: str) -> str:
    """Função de conveniência usada pelas views — esconde a escolha de provider."""
    provider = _build_provider()
    return provider.generate_response(
        company_context=company_context,
        conversation_history=conversation_history,
        user_message=user_message,
    )
