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
