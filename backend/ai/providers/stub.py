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
        # Implementação propositalmente simples: ecoa a pergunta e sinaliza que
        # ainda é uma resposta simulada. O objetivo aqui é validar o fluxo
        # (mensagem -> contexto -> "IA" -> resposta -> banco), não gerar respostas
        # inteligentes de verdade — isso é trabalho da Fase 7.
        prefix = "[resposta simulada — provider stub]"
        if company_context:
            return f"{prefix} Com base nas informações da empresa, aqui está uma resposta para: \"{user_message}\""
        return f"{prefix} Recebi sua mensagem: \"{user_message}\""
