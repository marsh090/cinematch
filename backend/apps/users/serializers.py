from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import UserFollow

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'name', 'is_following')
        read_only_fields = ('id',)

    def get_is_following(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated or request.user == obj:
            return False
        return UserFollow.objects.filter(user=request.user, following=obj).exists()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password2', 'first_name', 'last_name', 'name')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "As senhas não conferem"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class UserFollowSerializer(serializers.ModelSerializer):
    following_username = serializers.CharField(source='following.username', read_only=True)
    following_name = serializers.CharField(source='following.name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = UserFollow
        fields = ['id', 'user', 'user_username', 'user_name', 'following', 'following_username', 'following_name', 'created_at'] 