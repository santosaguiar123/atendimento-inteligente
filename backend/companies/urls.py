from django.urls import path

from .views import CompanyDetailView, CompanyListCreateView, PublicCompanyDetailView

app_name = "companies"

urlpatterns = [
    path("companies/", CompanyListCreateView.as_view(), name="list-create"),
    path("companies/<uuid:pk>/", CompanyDetailView.as_view(), name="detail"),
    path("public/companies/<slug:slug>/", PublicCompanyDetailView.as_view(), name="public-detail"),
]
