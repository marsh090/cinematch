from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views import UserViewSet, RegisterView
from apps.movies.views import FilmeViewSet, ForumCommentViewSet
from apps.communities.views import CommunityViewSet, ChatViewSet, TextMessageViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'movies', FilmeViewSet)
router.register(r'forum', ForumCommentViewSet, basename='forumcomment')
router.register(r'communities', CommunityViewSet)

# Nested routers para chats e mensagens
community_router = DefaultRouter()
community_router.register(r'chats', ChatViewSet, basename='community-chats')

chat_router = DefaultRouter()
chat_router.register(r'messages', TextMessageViewSet, basename='chat-messages')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/events/', include('apps.events.urls')),
    path('api/communities/<int:community_id>/', include(community_router.urls)),
    path('api/communities/<int:community_id>/chats/<int:chat_id>/', include(chat_router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)