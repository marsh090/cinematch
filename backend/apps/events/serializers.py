from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Event

User = get_user_model()

class UserMinimalSerializer(serializers.ModelSerializer):
    """Serializer mínimo para usuários em listas de eventos"""
    class Meta:
        model = User
        fields = ('id', 'username', 'name', 'avatar')

class EventSerializer(serializers.ModelSerializer):
    """Serializer para eventos"""
    owner = UserMinimalSerializer(read_only=True)
    participants = UserMinimalSerializer(many=True, read_only=True)
    owner_id = serializers.UUIDField(write_only=True, required=False)
    participant_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    is_participating = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = (
            'id', 'title', 'description', 'event_datetime', 'location', 
            'image', 'owner', 'participants', 'created_at', 'updated_at',
            'owner_id', 'participant_ids', 'is_participating'
        )
    
    def get_is_participating(self, obj):
        """Verifica se o usuário atual é participante do evento"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.participants.filter(id=request.user.id).exists()
        return False
    
    def create(self, validated_data):
        """
        Cria um evento com os participantes especificados.
        O owner é o usuário atual se não for especificado.
        """
        participant_ids = validated_data.pop('participant_ids', [])
        
        request = self.context.get('request')
        if not validated_data.get('owner_id') and request and request.user.is_authenticated:
            validated_data['owner'] = request.user
        elif validated_data.get('owner_id'):
            try:
                owner = User.objects.get(id=validated_data.pop('owner_id'))
                validated_data['owner'] = owner
            except User.DoesNotExist:
                raise serializers.ValidationError({'owner_id': 'Usuário não encontrado'})
        
        event = Event.objects.create(**validated_data)
        
        # Adiciona participantes
        if participant_ids:
            participants = User.objects.filter(id__in=participant_ids)
            event.participants.add(*participants)
        
        return event
    
    def update(self, instance, validated_data):
        """Atualiza um evento e seus participantes"""
        participant_ids = validated_data.pop('participant_ids', None)
        
        # Atualiza os campos do evento
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Atualiza participantes se fornecidos
        if participant_ids is not None:
            instance.participants.clear()
            participants = User.objects.filter(id__in=participant_ids)
            instance.participants.add(*participants)
        
        return instance 