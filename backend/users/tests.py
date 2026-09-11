from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory, APITestCase
from rest_framework.views import APIView

from .models import User


class ProtectedTestView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"status": "ok"})


class AuthenticationAPITests(APITestCase):
    register_url = "/api/auth/register/"
    login_url = "/api/auth/login/"
    valid_payload = {
        "email": "admin@example.com",
        "full_name": "Admin Teste",
        "password": "Senha-forte-123!",
    }

    def test_register_valid_data_returns_201_without_password(self):
        response = self.client.post(self.register_url, self.valid_payload, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertNotIn("password", response.data)
        user = User.objects.get(email=self.valid_payload["email"])
        self.assertTrue(user.check_password(self.valid_payload["password"]))

    def test_register_duplicate_email_returns_400(self):
        self.client.post(self.register_url, self.valid_payload, format="json")
        response = self.client.post(self.register_url, self.valid_payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)

    def test_login_valid_credentials_returns_200_with_token(self):
        User.objects.create_user(**self.valid_payload)
        response = self.client.post(
            self.login_url,
            {"email": self.valid_payload["email"], "password": self.valid_payload["password"]},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.data)

    def test_login_wrong_password_returns_400(self):
        User.objects.create_user(**self.valid_payload)
        response = self.client.post(
            self.login_url,
            {"email": self.valid_payload["email"], "password": "senha-errada"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["detail"], "E-mail ou senha inválidos.")

    def test_protected_view_without_token_returns_401(self):
        request = APIRequestFactory().get("/protected/")
        response = ProtectedTestView.as_view()(request)

        self.assertEqual(response.status_code, 401)


class UserModelTests(APITestCase):
    def test_user_normalizes_email_and_hashes_password(self):
        user = User.objects.create_user(email="admin@EXAMPLE.COM", password="secret")
        user.refresh_from_db()
        self.assertEqual(user.email, "admin@example.com")
        self.assertNotEqual(user.password, "secret")
        self.assertTrue(user.check_password("secret"))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)

    def test_email_is_required(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", password="secret")
