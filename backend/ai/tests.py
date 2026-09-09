from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase

from . import services
from .providers.openrouter import OpenRouterProvider
from .providers.stub import StubAIProvider


class OpenRouterProviderTests(SimpleTestCase):
    @patch("ai.providers.openrouter.OpenAI")
    def test_uses_company_context_history_and_customer_message(self, mock_client_class):
        client = MagicMock()
        client.chat.completions.create.return_value = SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(
                        content="  Funcionamos de segunda a sexta, das 9h às 18h.  "
                    )
                )
            ]
        )
        mock_client_class.return_value = client

        with patch.dict(
            "os.environ",
            {
                "OPENROUTER_API_KEY": "test-key",
                "OPENROUTER_MODEL": "openrouter/free",
                "OPENROUTER_MAX_TOKENS": "240",
            },
            clear=False,
        ):
            provider = OpenRouterProvider()
            answer = provider.generate_response(
                company_context="Funcionamento: segunda a sexta, das 9h às 18h.",
                conversation_history=[
                    {"sender": "CUSTOMER", "content": "Olá"},
                    {"sender": "AI", "content": "Como posso ajudar?"},
                ],
                user_message="Qual é o horário?",
            )

        self.assertEqual(answer, "Funcionamos de segunda a sexta, das 9h às 18h.")
        request = client.chat.completions.create.call_args.kwargs
        self.assertEqual(request["model"], "openrouter/free")
        self.assertEqual(request["max_tokens"], 240)
        self.assertIn("Funcionamento: segunda a sexta", request["messages"][0]["content"])
        self.assertEqual(
            request["messages"][1:],
            [
                {"role": "user", "content": "Olá"},
                {"role": "assistant", "content": "Como posso ajudar?"},
                {"role": "user", "content": "Qual é o horário?"},
            ],
        )

    def test_requires_api_key(self):
        with patch.dict("os.environ", {"OPENROUTER_API_KEY": ""}, clear=False):
            with self.assertRaisesRegex(ValueError, "OPENROUTER_API_KEY"):
                OpenRouterProvider()

    def test_rejects_paid_model_to_prevent_accidental_charges(self):
        with patch.dict(
            "os.environ",
            {
                "OPENROUTER_API_KEY": "test-key",
                "OPENROUTER_MODEL": "openai/gpt-5",
            },
            clear=False,
        ):
            with self.assertRaisesRegex(ValueError, "impedir cobranças"):
                OpenRouterProvider()

    @patch("ai.providers.openrouter.OpenAI")
    def test_rejects_empty_model_response(self, mock_client_class):
        client = MagicMock()
        client.chat.completions.create.return_value = SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content="   "))]
        )
        mock_client_class.return_value = client

        with patch.dict("os.environ", {"OPENROUTER_API_KEY": "test-key"}, clear=False):
            provider = OpenRouterProvider()
            with self.assertRaisesRegex(RuntimeError, "resposta vazia"):
                provider.generate_response(
                    company_context="",
                    conversation_history=[],
                    user_message="Olá",
                )


class AIProviderSelectionTests(SimpleTestCase):
    def test_stub_remains_available(self):
        with patch.dict("os.environ", {"AI_PROVIDER": "stub"}, clear=False):
            self.assertIsInstance(services._build_provider(), StubAIProvider)

    @patch("ai.providers.openrouter.OpenAI")
    def test_selects_openrouter_provider(self, mock_client_class):
        with patch.dict(
            "os.environ",
            {"AI_PROVIDER": "openrouter", "OPENROUTER_API_KEY": "test-key"},
            clear=False,
        ):
            self.assertIsInstance(services._build_provider(), OpenRouterProvider)
