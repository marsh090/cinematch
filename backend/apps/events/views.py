from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Event
from .serializers import EventSerializer

class EventViewSet(viewsets.ModelViewSet):
    """
    Viewset para gerenciar eventos.
    """
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Retorna eventos, opcionalmente filtrados por:
        - month (YYYY-MM): mês específico
        - user: eventos de um usuário específico
        - participating: apenas eventos que o usuário atual participa
        - owned: apenas eventos que o usuário atual é dono
        """
        queryset = Event.objects.all()
        
        # Filtrar por mês (format: YYYY-MM)
        month_param = self.request.query_params.get('month')
        if month_param and len(month_param) == 7:
            try:
                year, month = month_param.split('-')
                year, month = int(year), int(month)
                next_month = month + 1 if month < 12 else 1
                next_year = year if month < 12 else year + 1
                start_date = timezone.datetime(year, month, 1)
                end_date = timezone.datetime(next_year, next_month, 1)
                queryset = queryset.filter(
                    event_datetime__gte=start_date,
                    event_datetime__lt=end_date
                )
            except (ValueError, TypeError):
                pass
        
        # Filtrar por usuário específico
        user_param = self.request.query_params.get('user')
        if user_param:
            queryset = queryset.filter(
                Q(owner__username=user_param) | 
                Q(participants__username=user_param)
            ).distinct()
        
        # Filtrar por participação do usuário atual
        participating = self.request.query_params.get('participating')
        if participating == 'true':
            queryset = queryset.filter(participants=self.request.user)
        
        # Filtrar por eventos criados pelo usuário atual
        owned = self.request.query_params.get('owned')
        if owned == 'true':
            queryset = queryset.filter(owner=self.request.user)
        
        return queryset
    
    def perform_create(self, serializer):
        """Criar um evento, definindo o usuário atual como dono se não especificado"""
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Adiciona o usuário atual como participante do evento"""
        event = self.get_object()
        if event.participants.filter(id=request.user.id).exists():
            return Response({'message': 'Você já é participante deste evento'},
                          status=status.HTTP_400_BAD_REQUEST)
        
        event.participants.add(request.user)
        return Response({'message': 'Você agora é participante deste evento'},
                       status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Remove o usuário atual da lista de participantes do evento"""
        event = self.get_object()
        if not event.participants.filter(id=request.user.id).exists():
            return Response({'message': 'Você não é participante deste evento'},
                          status=status.HTTP_400_BAD_REQUEST)
        
        event.participants.remove(request.user)
        return Response({'message': 'Você saiu deste evento'},
                       status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def user_stats(self, request):
        """
        Retorna estatísticas de eventos do usuário especificado
        - total_events: total de eventos que participa ou é dono
        - owned_events: total de eventos criados
        - upcoming_events: eventos futuros
        """
        username = request.query_params.get('username', request.user.username)
        
        # Eventos totais (participa ou é dono)
        user_events = Event.objects.filter(
            Q(owner__username=username) | 
            Q(participants__username=username)
        ).distinct()
        
        # Eventos criados
        owned_events = Event.objects.filter(owner__username=username)
        
        # Eventos futuros
        now = timezone.now()
        upcoming_events = user_events.filter(event_datetime__gt=now)
        
        return Response({
            'total_events': user_events.count(),
            'owned_events': owned_events.count(),
            'upcoming_events': upcoming_events.count(),
        }) 