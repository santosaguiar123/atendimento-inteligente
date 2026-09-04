from django.urls import path

from .views import PingView

app_name = "users"

urlpatterns = [
    path("ping/", PingView.as_view(), name="ping"),
    # TODO (Fase 3): path("register/", RegisterView.as_view(), name="register")
    # TODO (Fase 3): path("login/", LoginView.as_view(), name="login")
]
