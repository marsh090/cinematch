from rest_framework import serializers
from .models import Community, Chat

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