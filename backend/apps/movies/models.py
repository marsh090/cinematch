from django.db import models
import uuid
from django.conf import settings

class Filme(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tmdb_id = models.IntegerField(unique=True)
    titulo = models.CharField(max_length=255)
    sinopse = models.TextField(null=True, blank=True)
    data_lancamento = models.DateField(null=True, blank=True)
    duracao = models.IntegerField(null=True, blank=True, help_text="Duração em minutos")
    poster_url = models.URLField(max_length=500, null=True, blank=True)
    backdrop_url = models.URLField(max_length=500, null=True, blank=True)
    generos = models.JSONField(default=list)
    diretores = models.JSONField(default=list)
    atores_principais = models.JSONField(default=list)
    nota_media = models.FloatField(default=0.0)
    total_votos = models.IntegerField(default=0)
    status = models.CharField(max_length=50, null=True, blank=True)
    idioma_original = models.CharField(max_length=10, null=True, blank=True)
    orcamento = models.BigIntegerField(null=True, blank=True)
    receita = models.BigIntegerField(null=True, blank=True)
    tagline = models.CharField(max_length=255, null=True, blank=True)
    site_oficial = models.URLField(max_length=500, null=True, blank=True)
    video = models.BooleanField(default=False)
    adulto = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.titulo

    class Meta:
        verbose_name = 'Filme'
        verbose_name_plural = 'Filmes'
        ordering = ['-data_lancamento']

class FilmeUserAction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='filme_actions')
    filme = models.ForeignKey('Filme', on_delete=models.CASCADE, related_name='user_actions')
    like = models.IntegerField(null=True, blank=True, help_text="0 = não gostei, 1 = gostei, null = não votou")
    favoritado = models.BooleanField(default=False)
    assistir_mais_tarde = models.BooleanField(default=False)
    assistido = models.BooleanField(default=False)
    avaliacao = models.FloatField(null=True, blank=True)  # 0-10

    class Meta:
        unique_together = ('user', 'filme')

class ForumComment(models.Model):
    filme = models.ForeignKey('Filme', on_delete=models.CASCADE, related_name='forum_comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    texto = models.TextField()
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')
    likes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='liked_comments', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reported = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Comentário de {self.user} em {self.filme}" 