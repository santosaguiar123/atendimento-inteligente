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

    @patch("conversations.views.ai_services.get_ai_response", return_value="Resposta mockada")
    def test_forged_sender_is_saved_as_customer(self, mock_get_ai_response):
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


class PersistenceModelTests(APITestCase):
    def test_relationships_defaults_and_cascade_deletion(self):
        owner = User.objects.create_user(email="model@example.com", password="secret")
        company = Company.objects.create(owner=owner, name="Empresa Model")
        conversation = Conversation.objects.create(company=company)
        message = Message.objects.create(conversation=conversation, sender=Message.Sender.CUSTOMER, content="Ola")
        company.refresh_from_db()
        conversation.refresh_from_db()
        message.refresh_from_db()
        self.assertEqual(list(owner.companies.all()), [company])
        self.assertEqual(list(company.conversations.all()), [conversation])
        self.assertEqual(list(conversation.messages.all()), [message])
        self.assertEqual(conversation.status, Conversation.Status.OPEN)
        self.assertEqual(conversation.customer_identifier, "")
        for obj in (owner, company, conversation, message):
            self.assertIsInstance(obj.pk, uuid.UUID)
        self.assertIsNotNone(message.created_at)
        owner.delete()
        self.assertFalse(Company.objects.exists())
        self.assertFalse(Conversation.objects.exists())
        self.assertFalse(Message.objects.exists())


class EndToEndAPITests(APITestCase):
    @patch("conversations.views.ai_services.get_ai_response", return_value="Abrimos as 9h.")
    def test_register_login_company_public_conversation_and_ai_reply(self, mock_ai):
        credentials = {"email": "e2e@example.com", "password": "Senha-forte-123!"}
        response = self.client.post("/api/auth/register/", {**credentials, "full_name": "Dono"}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertNotIn("password", response.data)
        response = self.client.post("/api/auth/login/", credentials, format="json")
        self.assertEqual(response.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {response.data['token']}")
        response = self.client.post("/api/companies/", {"name": "Empresa E2E", "ai_context": "Abrimos as 9h."}, format="json")
        self.assertEqual(response.status_code, 201)
        company = Company.objects.get(pk=response.data["id"])
        self.assertEqual(company.owner.email, credentials["email"])
        self.client.credentials()
        response = self.client.get(f"/api/public/companies/{company.slug}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["name"], company.name)
        response = self.client.post(f"/api/public/companies/{company.slug}/conversations/", {"customer_identifier": "Cliente"}, format="json")
        self.assertEqual(response.status_code, 201)
        conversation = Conversation.objects.get(pk=response.data["id"])
        self.assertEqual(conversation.company, company)
        url = f"/api/conversations/{conversation.id}/messages/"
        response = self.client.post(url, {"content": "Quando abre?"}, format="json")
        self.assertEqual(response.status_code, 201)
        mock_ai.assert_called_once_with(company_context="Abrimos as 9h.", conversation_history=[], user_message="Quando abre?")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        expected = [("CUSTOMER", "Quando abre?"), ("AI", "Abrimos as 9h.")]
        self.assertEqual([(item["sender"], item["content"]) for item in response.data], expected)
        self.assertEqual(list(conversation.messages.values_list("sender", "content")), expected)

    @patch("conversations.views.ai_services.get_ai_response")
    def test_invalid_content_never_persists_or_calls_ai(self, mock_ai):
        owner = User.objects.create_user(email="empty@example.com", password="secret")
        company = Company.objects.create(owner=owner, name="Empresa")
        conversation = Conversation.objects.create(company=company)
        for payload in ({}, {"content": ""}, {"content": " \n\t "}, {"content": None}):
            with self.subTest(payload=payload):
                response = self.client.post(f"/api/conversations/{conversation.id}/messages/", payload, format="json")
                self.assertEqual(response.status_code, 400)
                self.assertIn("content", response.data)
        self.assertFalse(conversation.messages.exists())
        mock_ai.assert_not_called()
