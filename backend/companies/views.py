from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Company
from .serializers import CompanySerializer, PublicCompanySerializer


class CompanyListCreateView(generics.ListCreateAPIView):
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Company.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class CompanyDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        return Company.objects.filter(owner=self.request.user)


class PublicCompanyDetailView(generics.RetrieveAPIView):
    queryset = Company.objects.all()
    serializer_class = PublicCompanySerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
