"""
URLs raiz do projeto.

Cada app do domínio expõe seu próprio urls.py (users/urls.py, companies/urls.py,
conversations/urls.py), incluído aqui com um prefixo. Isso mantém as rotas de cada
domínio junto do código daquele domínio, em vez de um arquivo gigante e centralizado.
Ver docs/api.md para o contrato completo dos endpoints.
"""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("users.urls")),
    path("api/", include("companies.urls")),
    path("api/", include("conversations.urls")),
]
