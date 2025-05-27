from django.db import models
from django.conf import settings
import uuid

class Event(models.Model):
    """
    Modelo para eventos do calendário.
    Um evento tem um dono (owner) e pode ter vários participantes.
    Um usuário pode ser dono de vários eventos e participar de vários eventos.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    event_datetime = models.DateTimeField()
    location = models.CharField(max_length=200, blank=True, null=True)
    image = models.URLField(max_length=500, blank=True, null=True)
    
    # Relações com usuários
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='owned_events',
        on_delete=models.CASCADE
    )
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='events_participating',
        blank=True
    )
    
    # Metadados
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.event_datetime.strftime('%d/%m/%Y %H:%M')})"

    class Meta:
        verbose_name = 'Evento'
        verbose_name_plural = 'Eventos'
        ordering = ['event_datetime'] 