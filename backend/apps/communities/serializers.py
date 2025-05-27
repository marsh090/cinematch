from rest_framework import serializers
from .models import Community, Chat, TextMessage

class CommunitySerializer(serializers.ModelSerializer):
    icon_url = serializers.SerializerMethodField()

    class Meta:
        model = Community
        fields = '__all__'

    def get_icon_url(self, obj):
        request = self.context.get('request')
        if obj.icon and request:
            return request.build_absolute_uri(obj.icon.url)
        return None

class ChatSerializer(serializers.ModelSerializer):
    community = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Chat
        fields = '__all__'

class TextMessageSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    chat = serializers.PrimaryKeyRelatedField(queryset=Chat.objects.all(), write_only=True)
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = TextMessage
        fields = ['id', 'content', 'sent_at', 'username', 'chat', 'user']
        read_only_fields = ['sent_at', 'username', 'user']
        extra_kwargs = {
            'chat': {'write_only': True}  # O campo chat não será retornado nas respostas
        }

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data) 