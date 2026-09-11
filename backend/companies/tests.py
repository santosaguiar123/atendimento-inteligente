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

    def test_list_contains_only_owned_companies(self):
        response = self.client.get("/api/companies/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data], [str(self.company_a.id)])

    def test_owner_can_retrieve_and_edit_company(self):
        url = f"/api/companies/{self.company_a.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["name"], self.company_a.name)
        original_slug = self.company_a.slug
        payload = {"name": "Novo nome", "description": "Nova descricao", "ai_context": "Abre as 9h"}
        response = self.client.patch(url, payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.company_a.refresh_from_db()
        for field, value in payload.items():
            self.assertEqual(getattr(self.company_a, field), value)
        self.assertEqual(self.company_a.slug, original_slug)
        self.assertEqual(self.company_a.owner, self.user_a)

    def test_private_endpoints_require_authentication(self):
        self.client.force_authenticate(user=None)
        for method, url, payload in [
            ("get", "/api/companies/", {}),
            ("post", "/api/companies/", {"name": "Anonima"}),
            ("get", f"/api/companies/{self.company_a.id}/", {}),
            ("patch", f"/api/companies/{self.company_a.id}/", {"name": "Alterada"}),
        ]:
            with self.subTest(method=method, url=url):
                response = getattr(self.client, method)(url, payload, format="json")
                self.assertEqual(response.status_code, 401)
        self.assertEqual(Company.objects.count(), 2)
        self.company_a.refresh_from_db()
        self.assertEqual(self.company_a.name, "Empresa A")
