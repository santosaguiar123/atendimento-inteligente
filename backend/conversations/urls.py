from django.urls import path

from .views import ConversationCreateView, MessageListCreateView

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
]
