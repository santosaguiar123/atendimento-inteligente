from rest_framework import serializers

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "sender", "content", "created_at"]
        read_only_fields = ["id", "sender", "created_at"]
        # 'sender' é read-only aqui porque, na criação (Fase 5/7), quem define o
        # sender é a view (mensagem recebida = CUSTOMER; mensagem gerada = AI),
        # nunca o cliente da API.


class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ["id", "company", "customer_identifier", "status", "created_at"]
        read_only_fields = ["id", "company", "status", "created_at"]
