"""
Serializers do app users.

TODO (Fase 3 do roadmap — ver docs/roadmap.md):
Implementar aqui os serializers de registro e login, seguindo o contrato definido
em docs/api.md ("Autenticação"):

- RegisterSerializer: deve validar email único e usar `User.objects.create_user(...)`
  (NUNCA `User.objects.create(...)`, que não faz o hash da senha).
- LoginSerializer: deve validar as credenciais com `django.contrib.auth.authenticate`.

Este arquivo é deixado propositalmente como esqueleto: implementar autenticação do
zero (mesmo que só a "cola" entre Django e DRF) é um exercício importante para
entender como o DRF valida dados e como o Django lida com senhas.
"""
from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Representação pública de um usuário (sem senha), usada nas respostas da API."""

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "date_joined"]
        read_only_fields = fields
