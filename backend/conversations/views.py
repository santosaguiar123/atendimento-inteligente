import logging
import uuid

from rest_framework import generics, status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ai import services as ai_services
from companies.models import Company

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


logger = logging.getLogger(__name__)
RECENT_HISTORY_LIMIT = 20


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

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        conversation = self.get_conversation()
        customer_message = serializer.save(
            conversation=conversation,
            sender=Message.Sender.CUSTOMER,
        )

        recent_messages = list(
            Message.objects.filter(conversation=conversation)
            .exclude(pk=customer_message.pk)
            .order_by("-created_at")[:RECENT_HISTORY_LIMIT]
        )
        conversation_history = [
            {"sender": message.sender, "content": message.content}
            for message in reversed(recent_messages)
        ]

        try:
            ai_content = ai_services.get_ai_response(
                company_context=conversation.company.ai_context,
                conversation_history=conversation_history,
                user_message=customer_message.content,
            )
        except Exception:
            logger.exception(
                "Falha ao gerar resposta de IA para a conversa %s", conversation.id
            )
            return Response(
                {
                    "detail": (
                        "Mensagem recebida, mas não foi possível gerar a resposta "
                        "automática."
                    ),
                    "customer_message": MessageSerializer(customer_message).data,
                    "ai_response_created": False,
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        Message.objects.create(
            conversation=conversation,
            sender=Message.Sender.AI,
            content=ai_content,
        )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
