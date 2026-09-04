from rest_framework import serializers

from .models import Company


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ["id", "name", "slug", "description", "ai_context", "created_at", "updated_at"]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]


class PublicCompanySerializer(serializers.ModelSerializer):
    """
    Serializer usado no canal público (docs/api.md: GET /api/public/companies/{slug}/).

    Expõe deliberadamente só nome e slug — NUNCA `ai_context` ou `owner`, que são
    informações internas da empresa.
    """

    class Meta:
        model = Company
        fields = ["name", "slug", "description"]
        read_only_fields = fields
