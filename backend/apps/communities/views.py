from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Community, Chat, ChatType, TextMessage
from .serializers import CommunitySerializer, ChatSerializer
from django.contrib.auth import get_user_model

class CommunityViewSet(viewsets.ModelViewSet):
    queryset = Community.objects.all()
    serializer_class = CommunitySerializer
    parser_classes = (JSONParser, MultiPartParser, FormParser)

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
    queryset = Chat.objects.all()
    serializer_class = ChatSerializer

    @action(detail=True, methods=['get'], url_path='chats')
    def list_chats(self, request, pk=None):
        community = Community.objects.get(pk=pk)
        chats = Chat.objects.filter(community=community)
        serializer = self.get_serializer(chats, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'], url_path='messages')
    def chat_messages(self, request, community_id=None, pk=None):
        chat = self.get_object()
        if request.method == 'GET':
            messages = TextMessage.objects.filter(chat=chat).order_by('-sent_at')
            message_data = [{'username': msg.user.username, 'content': msg.content, 'sent_at': msg.sent_at} for msg in messages]
            return Response(message_data)
        elif request.method == 'POST':
            content = request.data.get('content')
            if not content:
                return Response({'error': 'Content is required.'}, status=status.HTTP_400_BAD_REQUEST)
            TextMessage.objects.create(content=content, user=request.user, chat=chat)
            return Response({'detail': 'Message posted successfully.'}, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        community_id = self.kwargs.get('community_id')
        community = Community.objects.get(pk=community_id)
        serializer.save(community=community)

    def list(self, request, *args, **kwargs):
        community_id = self.kwargs.get('community_id')
        community = Community.objects.get(pk=community_id)
        queryset = self.filter_queryset(self.get_queryset().filter(community=community))
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data) 