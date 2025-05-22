from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views import UserViewSet
from apps.movies.views import FilmeViewSet, ForumCommentViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'movies', FilmeViewSet)
router.register(r'forum', ForumCommentViewSet, basename='forumcomment')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
] 