from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from .models import Filme, FilmeUserAction, ForumComment
from .serializers import FilmeSerializer, FilmeUserActionSerializer, ForumCommentSerializer
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from django.contrib.auth import get_user_model
from apps.users.models import UserFollow
from .services import resumir_avaliacoes_com_gemini

User = get_user_model()

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100

class FilmeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Filme.objects.all()
    serializer_class = FilmeSerializer
    pagination_class = StandardResultsSetPagination

    @action(detail=True, methods=['get', 'post'], permission_classes=[permissions.IsAuthenticated], url_path='user_action')
    def user_action(self, request, pk=None):
        filme = self.get_object()
        user = request.user
        action_obj, _ = FilmeUserAction.objects.get_or_create(user=user, filme=filme)
        if request.method == 'GET':
            return Response(FilmeUserActionSerializer(action_obj).data)
        # POST: atualizar ações
        data = request.data
        if 'like' in data:
            try:
                val = int(data['like'])
                if val in [0, 1]:
                    action_obj.like = val
            except (ValueError, TypeError):
                pass
        for field in ['favoritado', 'assistir_mais_tarde', 'assistido']:
            if field in data:
                setattr(action_obj, field, bool(data[field]))
        if 'avaliacao' in data:
            try:
                val = float(data['avaliacao'])
                if 0 <= val <= 10:
                    action_obj.avaliacao = val
            except Exception:
                pass
        action_obj.save()
        # Atualizar nota média do filme
        avaliacoes = FilmeUserAction.objects.filter(filme=filme, avaliacao__isnull=False)
        if avaliacoes.exists():
            filme.nota_media = sum(a.avaliacao for a in avaliacoes) / avaliacoes.count()
            filme.total_votos = avaliacoes.count()
            filme.save()
        else:
            filme.nota_media = 0.0
            filme.total_votos = 0
            filme.save()
        return Response(FilmeUserActionSerializer(action_obj).data)

    @action(detail=True, methods=['get', 'post'], url_path='forum', permission_classes=[permissions.IsAuthenticated])
    def forum(self, request, pk=None):
        filme = self.get_object()
        parent_id = request.query_params.get('parent')
        if request.method == 'GET':
            filtro = request.query_params.get('filtro', 'recentes')
            queryset = ForumComment.objects.filter(filme=filme)
            if parent_id:
                queryset = queryset.filter(parent_id=parent_id)
            else:
                queryset = queryset.filter(parent=None)
            if filtro == 'antigos':
                queryset = queryset.order_by('created_at')
            elif filtro == 'bem_avaliados':
                queryset = queryset.annotate(num_likes=Count('likes')).order_by('-num_likes', '-created_at')
            else:
                queryset = queryset.order_by('-created_at')
            paginator = PageNumberPagination()
            paginator.page_size = 50
            page = paginator.paginate_queryset(queryset, request)
            serializer = ForumCommentSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        # POST: criar comentário ou resposta
        data = request.data.copy()
        data['user'] = request.user.id
        data['filme'] = filme.id
        serializer = ForumCommentSerializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, filme=filme)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated], url_path='update_action')
    def update_action(self, request, pk=None):
        filme = self.get_object()
        user = request.user
        data = request.data

        # Busca ou cria a ação do usuário para este filme
        action_obj, _ = FilmeUserAction.objects.get_or_create(user=user, filme=filme)

        # Atualiza apenas os campos que foram enviados
        for field in ['like', 'favoritado', 'assistir_mais_tarde', 'assistido', 'avaliacao']:
            if field in data:
                if field == 'like':
                    try:
                        val = int(data[field])
                        if val in [0, 1]:
                            action_obj.like = val
                    except (ValueError, TypeError):
                        pass
                elif field == 'avaliacao':
                    try:
                        val = float(data[field])
                        if 0 <= val <= 10:
                            action_obj.avaliacao = val
                    except (ValueError, TypeError):
                        pass
                else:
                    setattr(action_obj, field, bool(data[field]))

        action_obj.save()

        # Atualiza a nota média do filme se houver avaliação
        if 'avaliacao' in data:
            avaliacoes = FilmeUserAction.objects.filter(filme=filme, avaliacao__isnull=False)
            if avaliacoes.exists():
                filme.nota_media = sum(a.avaliacao for a in avaliacoes) / avaliacoes.count()
                filme.total_votos = avaliacoes.count()
                filme.save()
            else:
                filme.nota_media = 0.0
                filme.total_votos = 0
                filme.save()

        return Response(FilmeUserActionSerializer(action_obj).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated], url_path='rate')
    def rate(self, request, pk=None):
        filme = self.get_object()
        user = request.user
        data = request.data

        try:
            nota = float(data.get('nota', 0))
            if not (0 <= nota <= 10):
                return Response({'error': 'Nota deve estar entre 0 e 10'}, status=status.HTTP_400_BAD_REQUEST)

            # Busca a nota média e total de votos atuais
            nota_media_atual = filme.nota_media
            total_votos_atual = filme.total_votos

            # Calcula a nova nota média
            nota_total = nota_media_atual * total_votos_atual
            nota_total += nota
            total_votos_atual += 1
            nova_nota_media = nota_total / total_votos_atual

            # Atualiza o filme
            filme.nota_media = nova_nota_media
            filme.total_votos = total_votos_atual
            filme.save()

            # Atualiza ou cria a ação do usuário
            action_obj, _ = FilmeUserAction.objects.get_or_create(user=user, filme=filme)
            action_obj.avaliacao = nota
            action_obj.save()

            return Response({
                'nota_media': nova_nota_media,
                'total_votos': total_votos_atual,
                'sua_nota': nota
            })

        except (ValueError, TypeError):
            return Response({'error': 'Nota inválida'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='user_stats/(?P<username>[^/.]+)')
    def user_stats(self, request, username=None):
        try:
            user = User.objects.get(username=username)
            stats = FilmeUserAction.objects.filter(user=user).aggregate(
                total_assistidos=Count('id', filter=Q(assistido=True)),
                total_likes=Count('id', filter=Q(like=1))
            )
            total_criticas = ForumComment.objects.filter(user=user).count()
            seguidores = UserFollow.objects.filter(following=user).count()
            seguindo = UserFollow.objects.filter(user=user).count()
            return Response({
                'assistidos': stats['total_assistidos'],
                'likes': stats['total_likes'],
                'criticas': total_criticas,
                'seguidores': seguidores,
                'seguindo': seguindo
            })
        except User.DoesNotExist:
            return Response({'error': 'Usuário não encontrado'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='summarize-comments')
    def summarize_comments(self, request, pk=None):
        try:
            filme = self.get_object()
            comments = ForumComment.objects.filter(filme=filme)
            
            if not comments.exists():
                return Response({'resumo': 'Ainda não há comentários para este filme.'})

            avaliacoes = [
                {
                    'nota': None,  # ForumComment não tem avaliação
                    'curtidas': comment.likes.count(),
                    'comentario': comment.texto
                }
                for comment in comments
            ]
            
            pergunta_usuario = f"Resumo dos comentários do filme {filme.titulo}"
            resumo = resumir_avaliacoes_com_gemini(pergunta_usuario, avaliacoes)
            return Response({'resumo': resumo}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': 'Erro ao gerar resumo dos comentários', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ForumCommentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ForumCommentSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = ForumComment.objects.all()
        user = self.request.query_params.get('user')
        if user:
            queryset = queryset.filter(user__username=user)
        return queryset.select_related('user', 'filme').prefetch_related('likes')

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        comment = get_object_or_404(ForumComment, pk=pk)
        user = request.user
        if user in comment.likes.all():
            comment.likes.remove(user)
        else:
            comment.likes.add(user)
        return Response({'likes_count': comment.likes.count()})

    @action(detail=True, methods=['post'])
    def report(self, request, pk=None):
        # Apenas retorna "não implementado"
        return Response({'detail': 'Não implementado'}, status=501) 