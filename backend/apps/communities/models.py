from django.db import models
from django.conf import settings

class TextMessage(models.Model):
    content = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    chat = models.ForeignKey('Chat', on_delete=models.CASCADE, related_name='text_messages')

class Poll(models.Model):
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    total_votes = models.IntegerField(default=0)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    chat = models.ForeignKey('Chat', on_delete=models.CASCADE, related_name='polls')

class PollOption(models.Model):
    text = models.CharField(max_length=255)
    votes = models.IntegerField(default=0)
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name='options')
    voted_users = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='voted_options')

class Chat(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    chat_type = models.CharField(max_length=10, choices=[('text', 'Text'), ('calendar', 'Calendar'), ('poll', 'Poll')], default='text')
    community = models.ForeignKey('Community', on_delete=models.CASCADE, related_name='chats')

class ChatType(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)

class Community(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='communities')
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_communities')
    icon = models.ImageField(upload_to='community_icons/', null=True, blank=True)
    is_public = models.BooleanField(default=True) 