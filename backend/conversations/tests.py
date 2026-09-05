import uuid

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
