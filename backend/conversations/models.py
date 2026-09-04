"""
Models de conversa e mensagem.

Ver docs/database.md (seções 4 e 5) para a justificativa de cada campo — em
especial por que não existe um model `Customer` separado no MVP.
"""
import uuid

from django.db import models


class Conversation(models.Model):
    class Status(models.TextChoices):
        OPEN = "OPEN", "Aberta"
        CLOSED = "CLOSED", "Encerrada"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="conversations",
    )

    # Identificador leve e opcional do cliente (ex.: nome informado no chat).
    # Não é uma conta de usuário — ver docs/database.md, seção 4.
    customer_identifier = models.CharField(max_length=150, blank=True)

    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Conversa"
        verbose_name_plural = "Conversas"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Conversa {self.id} — {self.company.name}"


class Message(models.Model):
    class Sender(models.TextChoices):
        CUSTOMER = "CUSTOMER", "Cliente"
        AI = "AI", "IA"
        # HUMAN = "HUMAN", "Atendente humano"  # reservado para fase futura

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )

    sender = models.CharField(max_length=10, choices=Sender.choices)
    content = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Mensagem"
        verbose_name_plural = "Mensagens"
        ordering = ["created_at"]
        indexes = [
            # Cobre a query mais comum: mensagens de uma conversa em ordem
            # cronológica (ver docs/database.md, seção 5).
            models.Index(fields=["conversation", "created_at"]),
        ]

    def __str__(self):
        return f"[{self.sender}] {self.content[:40]}"
