from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from .models import Community, Chat, ChatType, TextMessage
from .serializers import CommunitySerializer, ChatSerializer, TextMessageSerializer
from django.contrib.auth import get_user_model

class CommunityViewSet(viewsets.ModelViewSet):
    queryset = Community.objects.all()
    serializer_class = CommunitySerializer
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user, members=[self.request.user])

    @action(detail=True, methods=['post'], url_path='upload-icon')
    def upload_icon(self, request, pk=None):
        community = self.get_object()
        image_file = request.FILES.get('icon')

        if not image_file:
            return Response({'error': 'Nenhuma imagem enviada'}, status=status.HTTP_400_BAD_REQUEST)

        if image_file.content_type not in ['image/jpeg', 'image/png']:
            return Response({'error': 'Formato de imagem inválido. Use JPG ou PNG'}, status=status.HTTP_400_BAD_REQUEST)

        community.icon = image_file
        community.save()
        serializer = self.get_serializer(community)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='add-member')
    def add_member(self, request, pk=None):
        community = self.get_object()
        if request.user != community.owner:
            return Response({'error': 'Only the owner can add members.'}, status=status.HTTP_403_FORBIDDEN)

        username = request.data.get('username')
        User = get_user_model()
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        community.members.add(user)
        community.save()
        return Response({'detail': 'Member added successfully.'})

    @action(detail=True, methods=['delete'], url_path='delete')
    def delete_community(self, request, pk=None):
        community = self.get_object()
        if request.user != community.owner:
            return Response({'error': 'Only the owner can delete the community.'}, status=status.HTTP_403_FORBIDDEN)

        community.delete()
        return Response({'detail': 'Community deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'], url_path='members')
    def list_members(self, request, pk=None):
        community = self.get_object()
        members = community.members.all()
        member_data = [{'id': member.id, 'username': member.username} for member in members]
        return Response(member_data)

class ChatViewSet(viewsets.ModelViewSet):
    serializer_class = ChatSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        community_id = self.kwargs.get('community_id')
        community = get_object_or_404(Community, id=community_id)
        
        # Verifica se o usuário é membro da comunidade
        if not community.members.filter(id=self.request.user.id).exists():
            raise PermissionDenied("You must be a member of the community to access its chats.")
            
        return Chat.objects.filter(community_id=community_id)

    def perform_create(self, serializer):
        community_id = self.kwargs.get('community_id')
        community = get_object_or_404(Community, id=community_id)
        
        # Verifica se o usuário é membro da comunidade
        if not community.members.filter(id=self.request.user.id).exists():
            raise PermissionDenied("You must be a member of the community to create chats.")
            
        serializer.save(community=community)

class TextMessageViewSet(viewsets.ModelViewSet):
    serializer_class = TextMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        chat_id = self.kwargs.get('chat_id')
        community_id = self.kwargs.get('community_id')
        
        # Verifica se o chat existe e pertence à comunidade correta
        chat = get_object_or_404(Chat, id=chat_id, community_id=community_id)
        
        # Verifica se o usuário é membro da comunidade
        if not chat.community.members.filter(id=self.request.user.id).exists():
            raise PermissionDenied("You must be a member of the community to access messages.")
            
        return TextMessage.objects.filter(chat_id=chat_id).order_by('-sent_at')

    def create(self, request, *args, **kwargs):
        chat_id = self.kwargs.get('chat_id')
        community_id = self.kwargs.get('community_id')
        
        # Verifica se o chat existe e pertence à comunidade correta
        chat = get_object_or_404(Chat, id=chat_id, community_id=community_id)
        
        # Verifica se o usuário é membro da comunidade
        if not chat.community.members.filter(id=self.request.user.id).exists():
            raise PermissionDenied("You must be a member of the community to send messages.")
        
        # Adiciona o chat e o usuário aos dados da requisição
        data = request.data.copy()
        data['chat'] = chat.id
        data['user'] = request.user.id
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers) 