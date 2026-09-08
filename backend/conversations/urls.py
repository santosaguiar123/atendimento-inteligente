from django.urls import path

from .views import (
    CompanyConversationListView,
    ConversationCreateView,
    ConversationStatusUpdateView,
    MessageListCreateView,
)

app_name = "conversations"

urlpatterns = [
    path(
        "public/companies/<slug:slug>/conversations/",
        ConversationCreateView.as_view(),
        name="create",
    ),
    path(
        "conversations/<str:conversation_id>/messages/",
        MessageListCreateView.as_view(),
        name="messages",
    ),
    path(
        "companies/<uuid:company_id>/conversations/",
        CompanyConversationListView.as_view(),
        name="company-list",
    ),
    path(
        "conversations/<uuid:pk>/status/",
        ConversationStatusUpdateView.as_view(),
        name="status-update",
    ),
]
