from django.urls import path

from .views import LoginView, PingView, RegisterView

app_name = "users"

urlpatterns = [
    path("ping/", PingView.as_view(), name="ping"),
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
]
