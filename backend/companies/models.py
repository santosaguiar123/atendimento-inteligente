"""
Model de empresa (o negócio cadastrado por um administrador).

Ver docs/database.md (seção 3) para a justificativa de cada campo, em especial
`slug` (identificador público na URL do canal) e `ai_context` (texto livre usado
como contexto para a IA).
"""
import uuid

from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Company(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="companies",
    )

    name = models.CharField(max_length=150)
    slug = models.SlugField(unique=True, blank=True, max_length=170)
    description = models.TextField(blank=True)

    # Texto livre com as informações que a IA deve usar para responder aos
    # clientes (horários, políticas, produtos, FAQ). Ver docs/database.md, seção 3,
    # para a decisão de usar texto livre em vez de uma tabela estruturada de FAQ.
    ai_context = models.TextField(
        blank=True,
        help_text="Informações que a IA usará como contexto para responder clientes.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Empresa"
        verbose_name_plural = "Empresas"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Gera o slug a partir do nome apenas na criação (ou se ainda não existir),
        # para não quebrar o link público do canal se o nome for editado depois.
        # TODO (Fase 4): tratar colisão de slug (dois nomes iguais) de forma mais
        # robusta, ex.: anexar um sufixo numérico/aleatório quando já existir.
        if not self.slug:
            self.slug = slugify(self.name)[:170]
        super().save(*args, **kwargs)
