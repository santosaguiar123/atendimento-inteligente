"""
Configuração ASGI — não é usada pelo servidor de desenvolvimento nem pelo gunicorn
no MVP (que usa WSGI), mas mantida por ser o padrão gerado por 'django-admin
startproject' e por deixar o caminho aberto para features assíncronas no futuro
(ex.: WebSockets para chat em tempo real).
"""
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_asgi_application()
