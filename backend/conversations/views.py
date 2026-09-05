import uuid

from rest_framework import generics
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny

from companies.models import Company

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


class ConversationCreateView(generics.CreateAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        try:
            company = Company.objects.get(slug=self.kwargs["slug"])
        except Company.DoesNotExist as exc:
            raise NotFound("Empresa não encontrada.") from exc
        serializer.save(company=company)


class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [AllowAny]

    def get_conversation(self):
        try:
            conversation_id = uuid.UUID(self.kwargs["conversation_id"])
        except (ValueError, AttributeError) as exc:
            raise ValidationError({"detail": "ID de conversa inválido."}) from exc

        try:
            return Conversation.objects.get(id=conversation_id)
        except Conversation.DoesNotExist as exc:
            raise NotFound("Conversa não encontrada.") from exc

    def get_queryset(self):
        return Message.objects.filter(
            conversation=self.get_conversation()
        ).order_by("created_at")

    def perform_create(self, serializer):
        serializer.save(
            conversation=self.get_conversation(),
            sender=Message.Sender.CUSTOMER,
        )
