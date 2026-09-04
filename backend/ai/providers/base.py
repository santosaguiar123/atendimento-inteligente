"""
Interface (contrato) que qualquer provider de IA deve implementar.

Esta é a peça central da decisão de arquitetura descrita em docs/architecture.md,
seção 6: o resto do sistema depende desta interface, nunca de uma implementação
concreta. Isso é o que permite trocar de provedor de IA (ou usar um stub em
desenvolvimento/testes) sem alterar nenhum outro módulo.
"""
from abc import ABC, abstractmethod


class AIProvider(ABC):
    """Contrato mínimo para gerar uma resposta de atendimento."""

    @abstractmethod
    def generate_response(self, *, company_context: str, conversation_history: list[dict], user_message: str) -> str:
        """
        Gera uma resposta em linguagem natural para a mensagem do cliente.

        Args:
            company_context: texto livre com informações da empresa
                (Company.ai_context).
            conversation_history: lista de mensagens anteriores da conversa, no
                formato [{"sender": "CUSTOMER" | "AI", "content": str}, ...],
                em ordem cronológica.
            user_message: a nova mensagem enviada pelo cliente.

        Returns:
            O texto da resposta gerada.
        """
        raise NotImplementedError
