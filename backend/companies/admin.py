from django.contrib import admin

from .models import Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "owner", "created_at"]
    search_fields = ["name", "slug", "owner__email"]
    readonly_fields = ["slug"]  # slug é gerado automaticamente no save() do model
