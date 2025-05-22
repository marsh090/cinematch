from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'name']
    
    def __str__(self):
        return self.email

class UserFollow(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='following_set')
    following = models.ForeignKey('User', on_delete=models.CASCADE, related_name='followers_set')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'following')

    def save(self, *args, **kwargs):
        if self.user == self.following:
            raise ValueError('Usuário não pode seguir a si mesmo.')
        super().save(*args, **kwargs)
