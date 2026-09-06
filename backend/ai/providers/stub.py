"""
Provider "stub": implementação mínima e determinística da interface AIProvider,
usada como padrão no MVP para validar o fluxo completo ponta a ponta sem depender
de custo ou chave de API externa.

TODO (Fase 7 do roadmap): refinar esta implementação (hoje ela é só um esqueleto
funcional) e, quando quiser, criar um novo arquivo (ex.: providers/openai.py,
providers/anthropic.py — o nome é só um exemplo) implementando AIProvider com uma
chamada real a uma API de LLM. Nenhum outro módulo do sistema precisa mudar.
"""
from .base import AIProvider


class StubAIProvider(AIProvider):
    def generate_response(self, *, company_context: str, conversation_history: list[dict], user_message: str) -> str:
        prefix = "[resposta simulada — provider stub]"
        if company_context:
            return (
                f"{prefix} Baseado no contexto da empresa \"{company_context}\", "
                f"sobre \"{user_message}\", posso dizer que esta é uma resposta simulada."
            )
        return (
            f"{prefix} A empresa ainda não informou um contexto. "
            f"Sobre \"{user_message}\", esta é uma resposta simulada."
        )
