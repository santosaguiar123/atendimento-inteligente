from rest_framework import serializers

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    content = serializers.CharField(allow_blank=True, trim_whitespace=True)

    class Meta:
        model = Message
        fields = ["id", "sender", "content", "created_at"]
        read_only_fields = ["id", "sender", "created_at"]

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("O conteúdo da mensagem não pode estar vazio.")
        return value


class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ["id", "company", "customer_identifier", "status", "created_at"]
        read_only_fields = ["id", "company", "status", "created_at"]


class LastMessagePreviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["sender", "content", "created_at"]
        read_only_fields = fields


class ConversationSummarySerializer(serializers.ModelSerializer):
    """
    Usado no painel da empresa (GET /api/companies/{id}/conversations/) para listar
    conversas sem precisar de uma segunda chamada por conversa.

    `last_message` e `messages_count` custam uma query extra cada por conversa da
    lista (N+1). Para o volume de conversas do MVP isso é aceitável; se a lista
    crescer muito, considere anotar essas informações no queryset da view com
    `annotate`/`Prefetch` em vez de otimizar aqui de antemão.
    """

    last_message = serializers.SerializerMethodField()
    messages_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "customer_identifier",
            "status",
            "created_at",
            "updated_at",
            "last_message",
            "messages_count",
        ]
        read_only_fields = fields

    def get_last_message(self, obj):
        message = obj.messages.order_by("-created_at").first()
        if message is None:
            return None
        return LastMessagePreviewSerializer(message).data

    def get_messages_count(self, obj):
        return obj.messages.count()


class ConversationStatusSerializer(serializers.ModelSerializer):
    """Usado só para a empresa marcar uma conversa como resolvida/reaberta."""

    class Meta:
        model = Conversation
        fields = ["id", "status"]
        read_only_fields = ["id"]
