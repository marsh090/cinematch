from rest_framework import serializers
from .models import Filme, FilmeUserAction, ForumComment
from apps.users.serializers import UserSerializer

class FilmeSerializer(serializers.ModelSerializer):
    poster_path = serializers.SerializerMethodField()
    backdrop_path = serializers.SerializerMethodField()
    avaliacao_media = serializers.FloatField(source='nota_media')
    total_avaliacoes = serializers.IntegerField(source='total_votos')
    diretor = serializers.SerializerMethodField()
    elenco_principal = serializers.SerializerMethodField()

    class Meta:
        model = Filme
        fields = [
            'id',
            'tmdb_id',
            'titulo',
            'sinopse',
            'poster_path',
            'backdrop_path',
            'data_lancamento',
            'duracao',
            'generos',
            'avaliacao_media',
            'total_avaliacoes',
            'diretor',
            'elenco_principal',
            'idioma_original',
            'status',
            'tagline',
            'created_at',
            'updated_at'
        ]

    def get_poster_path(self, obj):
        return obj.poster_url

    def get_backdrop_path(self, obj):
        return obj.backdrop_url

    def get_diretor(self, obj):
        return obj.diretores[0] if obj.diretores else None

    def get_elenco_principal(self, obj):
        return obj.atores_principais[:5] if obj.atores_principais else []

class FilmeUserActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FilmeUserAction
        fields = ['like', 'favoritado', 'assistir_mais_tarde', 'assistido', 'avaliacao']

class ForumCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    filme_titulo = serializers.CharField(source='filme.titulo', read_only=True)

    class Meta:
        model = ForumComment
        fields = [
            'id', 'filme', 'filme_titulo', 'user', 'texto', 'parent', 'replies', 'likes_count', 'created_at', 'updated_at', 'reported'
        ]
        read_only_fields = ['user', 'likes_count', 'created_at', 'updated_at', 'replies', 'filme_titulo']

    def get_replies(self, obj):
        # Retorna apenas as respostas diretas (não recursivo)
        replies = obj.replies.all().order_by('created_at')
        return ForumCommentSerializer(replies, many=True, context=self.context).data

    def get_likes_count(self, obj):
        return obj.likes.count() 