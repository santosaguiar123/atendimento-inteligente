"""Prova de mutacao: roda os testes reais com os dois filtros owner removidos.

Executar: docker compose exec backend python check_owner_isolation.py
Nenhum arquivo de producao e alterado; os patches duram apenas este processo.
"""
import os
from unittest.mock import patch

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

from django.test.runner import DiscoverRunner
from companies.models import Company
from companies.views import CompanyDetailView, CompanyListCreateView


def unfiltered_queryset(self):
    return Company.objects.all()


if __name__ == "__main__":
    labels = [
        "companies.tests.CompanyAPITests.test_list_contains_only_owned_companies",
        "companies.tests.CompanyAPITests.test_owner_cannot_retrieve_another_users_company_by_uuid",
        "companies.tests.CompanyAPITests.test_owner_cannot_patch_another_users_company_by_uuid",
    ]
    with patch.object(CompanyListCreateView, "get_queryset", unfiltered_queryset), patch.object(
        CompanyDetailView, "get_queryset", unfiltered_queryset
    ):
        failures = DiscoverRunner(verbosity=2, interactive=False).run_tests(labels)
    if failures != len(labels):
        raise SystemExit(f"Prova de mutacao falhou: esperado 3 falhas, obtido {failures}.")
    print("MUTACAO DETECTADA: os 3 testes falharam sem o filtro owner, como esperado.")
