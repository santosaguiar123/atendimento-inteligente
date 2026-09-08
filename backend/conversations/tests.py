import uuid
from unittest.mock import patch

from rest_framework import status
from rest_framework.test import APITestCase

from companies.models import Company
from users.models import User

from .models import Conversation, Message


class PublicConversationAPITests(APITestCase):
    def setUp(self):
        owner = User.objects.create_user(email="owner@example.com", password="password")
        self.company = Company.objects.create(owner=owner, name="Empresa Pública")

    def test_create_conversation_with_valid_company_slug(self):
        response = self.client.post(
            f"/api/public/companies/{self.company.slug}/conversations/",
            {"customer_identifier": "Cliente 1"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        conversation = Conversation.objects.get(id=response.data["id"])
        self.assertEqual(conversation.company, self.company)
        self.assertEqual(conversation.customer_identifier, "Cliente 1")

    def test_create_conversation_with_unknown_slug_returns_clear_404(self):
        response = self.client.post(
            "/api/public/companies/slug-inexistente/conversations/",
            {"customer_identifier": "Cliente 1"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["detail"], "Empresa não encontrada.")

    def test_forged_sender_is_saved_as_customer(self):
        conversation = Conversation.objects.create(company=self.company)
        response = self.client.post(
            f"/api/conversations/{conversation.id}/messages/",
            {"sender": Message.Sender.AI, "content": "Olá"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        message = Message.objects.get(id=response.data["id"])
        self.assertEqual(message.sender, Message.Sender.CUSTOMER)
        self.assertEqual(response.data["sender"], Message.Sender.CUSTOMER)

    @patch("conversations.views.ai_services.get_ai_response")
    def test_customer_message_generates_and_persists_ai_response(self, mock_get_ai_response):
        self.company.ai_context = "Atendimento de segunda a sexta."
        self.company.save(update_fields=["ai_context"])
        conversation = Conversation.objects.create(company=self.company)
        Message.objects.create(
            conversation=conversation,
            sender=Message.Sender.AI,
            content="Como posso ajudar?",
        )
        mock_get_ai_response.return_value = "Nossa resposta automática."

        response = self.client.post(
            f"/api/conversations/{conversation.id}/messages/",
            {"content": "Qual é o horário?"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        customer_message = Message.objects.get(id=response.data["id"])
        self.assertEqual(customer_message.sender, Message.Sender.CUSTOMER)
        self.assertTrue(
            Message.objects.filter(
                conversation=conversation,
                sender=Message.Sender.AI,
                content="Nossa resposta automática.",
            ).exists()
        )
        mock_get_ai_response.assert_called_once_with(
            company_context="Atendimento de segunda a sexta.",
            conversation_history=[
                {"sender": Message.Sender.AI, "content": "Como posso ajudar?"}
            ],
            user_message="Qual é o horário?",
        )

    @patch("conversations.views.ai_services.get_ai_response")
    def test_provider_failure_keeps_customer_message_and_returns_clear_error(
        self, mock_get_ai_response
    ):
        conversation = Conversation.objects.create(company=self.company)
        mock_get_ai_response.side_effect = RuntimeError("provider indisponível")

        response = self.client.post(
            f"/api/conversations/{conversation.id}/messages/",
            {"content": "Preciso de ajuda"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertFalse(response.data["ai_response_created"])
        self.assertEqual(
            response.data["detail"],
            "Mensagem recebida, mas não foi possível gerar a resposta automática.",
        )
        self.assertEqual(response.data["customer_message"]["content"], "Preciso de ajuda")
        self.assertTrue(
            Message.objects.filter(
                conversation=conversation,
                sender=Message.Sender.CUSTOMER,
                content="Preciso de ajuda",
            ).exists()
        )
        self.assertFalse(
            Message.objects.filter(
                conversation=conversation,
                sender=Message.Sender.AI,
            ).exists()
        )

    def test_empty_content_is_rejected_with_clear_400(self):
        conversation = Conversation.objects.create(company=self.company)
        response = self.client.post(
            f"/api/conversations/{conversation.id}/messages/",
            {"content": "   "},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["content"][0],
            "O conteúdo da mensagem não pode estar vazio.",
        )
        self.assertFalse(Message.objects.filter(conversation=conversation).exists())

    def test_messages_are_listed_in_chronological_order(self):
        conversation = Conversation.objects.create(company=self.company)
        first = Message.objects.create(
            conversation=conversation,
            sender=Message.Sender.CUSTOMER,
            content="Primeira",
        )
        second = Message.objects.create(
            conversation=conversation,
            sender=Message.Sender.CUSTOMER,
            content="Segunda",
        )

        response = self.client.get(f"/api/conversations/{conversation.id}/messages/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [item["id"] for item in response.data],
            [str(first.id), str(second.id)],
        )

    def test_malformed_conversation_id_returns_clear_400(self):
        response = self.client.get("/api/conversations/not-a-uuid/messages/")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "ID de conversa inválido.")

    def test_unknown_conversation_uuid_returns_clear_404(self):
        response = self.client.get(f"/api/conversations/{uuid.uuid4()}/messages/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["detail"], "Conversa não encontrada.")


class CompanyConversationListAPITests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(email="owner@example.com", password="password")
        self.other_owner = User.objects.create_user(email="other@example.com", password="password")
        self.company = Company.objects.create(owner=self.owner, name="Minha Empresa")
        self.other_company = Company.objects.create(owner=self.other_owner, name="Outra Empresa")

    def test_requires_authentication(self):
        response = self.client.get(f"/api/companies/{self.company.id}/conversations/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_owner_cannot_list_conversations_of_another_owners_company(self):
        self.client.force_authenticate(self.owner)
        response = self.client.get(f"/api/companies/{self.other_company.id}/conversations/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_lists_only_conversations_of_the_requested_company(self):
        conversation = Conversation.objects.create(
            company=self.company, customer_identifier="Cliente 1"
        )
        Conversation.objects.create(company=self.other_company, customer_identifier="Cliente 2")
        self.client.force_authenticate(self.owner)

        response = self.client.get(f"/api/companies/{self.company.id}/conversations/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in response.data], [str(conversation.id)])

    def test_includes_last_message_preview_and_count(self):
        conversation = Conversation.objects.create(company=self.company)
        Message.objects.create(
            conversation=conversation, sender=Message.Sender.CUSTOMER, content="Primeira"
        )
        Message.objects.create(
            conversation=conversation, sender=Message.Sender.AI, content="Última"
        )
        self.client.force_authenticate(self.owner)

        response = self.client.get(f"/api/companies/{self.company.id}/conversations/")

        self.assertEqual(response.data[0]["messages_count"], 2)
        self.assertEqual(response.data[0]["last_message"]["content"], "Última")
        self.assertEqual(response.data[0]["last_message"]["sender"], Message.Sender.AI)

    def test_conversation_with_no_messages_has_null_last_message(self):
        Conversation.objects.create(company=self.company)
        self.client.force_authenticate(self.owner)

        response = self.client.get(f"/api/companies/{self.company.id}/conversations/")

        self.assertEqual(response.data[0]["messages_count"], 0)
        self.assertIsNone(response.data[0]["last_message"])


class ConversationStatusUpdateAPITests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(email="owner@example.com", password="password")
        self.other_owner = User.objects.create_user(email="other@example.com", password="password")
        self.company = Company.objects.create(owner=self.owner, name="Minha Empresa")
        self.conversation = Conversation.objects.create(company=self.company)

    def test_owner_can_mark_conversation_as_closed(self):
        self.client.force_authenticate(self.owner)
        response = self.client.patch(
            f"/api/conversations/{self.conversation.id}/status/",
            {"status": Conversation.Status.CLOSED},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.conversation.refresh_from_db()
        self.assertEqual(self.conversation.status, Conversation.Status.CLOSED)

    def test_other_owner_cannot_update_status(self):
        self.client.force_authenticate(self.other_owner)
        response = self.client.patch(
            f"/api/conversations/{self.conversation.id}/status/",
            {"status": Conversation.Status.CLOSED},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.conversation.refresh_from_db()
        self.assertEqual(self.conversation.status, Conversation.Status.OPEN)

    def test_invalid_status_value_is_rejected(self):
        self.client.force_authenticate(self.owner)
        response = self.client.patch(
            f"/api/conversations/{self.conversation.id}/status/",
            {"status": "INVALIDO"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
