from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views import UserViewSet, RegisterView
from apps.movies.views import FilmeViewSet, ForumCommentViewSet
from apps.communities.views import CommunityViewSet, ChatViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'movies', FilmeViewSet)
router.register(r'forum', ForumCommentViewSet, basename='forumcomment')
router.register(r'communities', CommunityViewSet)
router.register(r'communities/(?P<community_id>[^/.]+)/chats', ChatViewSet, basename='community-chats')
router.register(r'communities/(?P<community_id>[^/.]+)/chats/(?P<chat_id>[^/.]+)/messages', ChatViewSet, basename='chat-messages')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/events/', include('apps.events.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)