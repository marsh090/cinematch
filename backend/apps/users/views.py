from django.shortcuts import render
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserSerializer, UserRegistrationSerializer, UserFollowSerializer
from django.contrib.auth import get_user_model
from rest_framework.decorators import action
from .models import UserFollow
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer

class LoginView(APIView):
    permission_classes = (permissions.AllowAny,)
    parser_classes = [JSONParser]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        user = authenticate(email=email, password=password)

        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'username'
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_permissions(self):
        if self.action in ['create', 'login']:
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == 'create':
            return UserRegistrationSerializer
        return UserSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=False, methods=['post'], parser_classes=[JSONParser])
    def login(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Usuário não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not user.check_password(password):
            return Response(
                {'error': 'Senha incorreta'},
                status=status.HTTP_400_BAD_REQUEST
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='movies')
    def movies(self, request, username=None):
        filtro = request.query_params.get('filtro', 'assistidos')
        user = self.get_object()
        from apps.movies.models import FilmeUserAction
        from apps.movies.serializers import FilmeSerializer
        actions = FilmeUserAction.objects.filter(user=user)
        if filtro == 'assistidos':
            actions = actions.filter(assistido=True)
        elif filtro == 'favoritos':
            actions = actions.filter(favoritado=True)
        elif filtro == 'assistir_depois':
            actions = actions.filter(assistir_mais_tarde=True)
        filmes = [a.filme for a in actions.select_related('filme')]
        page = self.paginate_queryset(filmes)
        if page is not None:
            serializer = FilmeSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = FilmeSerializer(filmes, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post', 'delete'], url_path='follow')
    def follow(self, request, username=None):
        user = request.user
        to_follow = self.get_object()
        if user == to_follow:
            return Response({'error': 'Você não pode seguir a si mesmo.'}, status=status.HTTP_400_BAD_REQUEST)
        if request.method == 'POST':
            obj, created = UserFollow.objects.get_or_create(user=user, following=to_follow)
            if created:
                return Response({'detail': 'Seguindo com sucesso.'})
            return Response({'detail': 'Já está seguindo.'})
        else:  # DELETE
            deleted, _ = UserFollow.objects.filter(user=user, following=to_follow).delete()
            if deleted:
                return Response({'detail': 'Deixou de seguir.'})
            return Response({'detail': 'Você não estava seguindo.'})

    @action(detail=True, methods=['get'], url_path='followers')
    def followers(self, request, username=None):
        user = self.get_object()
        followers = UserFollow.objects.filter(following=user)
        serializer = UserFollowSerializer(followers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='following')
    def following(self, request, username=None):
        user = self.get_object()
        following = UserFollow.objects.filter(user=user)
        serializer = UserFollowSerializer(following, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='upload-image')
    def upload_image(self, request, username=None):
        user = self.get_object()
        image_type = request.data.get('type')
        image_file = request.FILES.get('image')

        if not image_file:
            return Response({'error': 'Nenhuma imagem enviada'}, status=status.HTTP_400_BAD_REQUEST)

        if image_type not in ['avatar', 'banner']:
            return Response({'error': 'Tipo de imagem inválido'}, status=status.HTTP_400_BAD_REQUEST)

        if image_file.content_type not in ['image/jpeg', 'image/png']:
            return Response({'error': 'Formato de imagem inválido. Use JPG ou PNG'}, status=status.HTTP_400_BAD_REQUEST)

        if image_type == 'avatar':
            user.avatar = image_file
        else:
            user.banner = image_file

        user.save()
        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='uuid-by-username/(?P<username>[^/.]+)')
    def get_uuid_by_username(self, request, username=None):
        try:
            user = User.objects.get(username=username)
            return Response({'uuid': str(user.id)})
        except User.DoesNotExist:
            return Response({'error': 'Usuário não encontrado'}, status=status.HTTP_404_NOT_FOUND)
