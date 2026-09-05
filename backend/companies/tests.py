from rest_framework import status
from rest_framework.test import APITestCase

from users.models import User

from .models import Company


class CompanyAPITests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(email="owner-a@example.com", password="password-a")
        self.user_b = User.objects.create_user(email="owner-b@example.com", password="password-b")
        self.company_a = Company.objects.create(owner=self.user_a, name="Empresa A")
        self.company_b = Company.objects.create(owner=self.user_b, name="Empresa B")
        self.client.force_authenticate(self.user_a)

    def test_owner_cannot_retrieve_another_users_company_by_uuid(self):
        response = self.client.get(f"/api/companies/{self.company_b.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_owner_cannot_patch_another_users_company_by_uuid(self):
        response = self.client.patch(
            f"/api/companies/{self.company_b.id}/",
            {"name": "Adulterada"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.company_b.refresh_from_db()
        self.assertEqual(self.company_b.name, "Empresa B")

    def test_create_ignores_owner_from_request_body(self):
        response = self.client.post(
            "/api/companies/",
            {"name": "Empresa Segura", "owner": str(self.user_b.id)},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Company.objects.get(id=response.data["id"]).owner, self.user_a)

    def test_equal_names_receive_incremental_slugs(self):
        first = self.client.post("/api/companies/", {"name": "Nome Igual"}, format="json")
        second = self.client.post("/api/companies/", {"name": "Nome Igual"}, format="json")
        self.assertEqual(first.data["slug"], "nome-igual")
        self.assertEqual(second.data["slug"], "nome-igual-2")

    def test_public_detail_exposes_only_public_fields(self):
        self.company_a.ai_context = "segredo"
        self.company_a.save()
        self.client.force_authenticate(user=None)
        response = self.client.get(f"/api/public/companies/{self.company_a.slug}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(set(response.data), {"name", "slug", "description"})
