from django.contrib import admin
from .models import Event

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'event_datetime', 'location', 'owner')
    list_filter = ('event_datetime', 'created_at')
    search_fields = ('title', 'description', 'location')
    filter_horizontal = ('participants',)
    raw_id_fields = ('owner',) 