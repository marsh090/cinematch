"""
Script para carregar dados iniciais para o app de eventos.
Uso: 
  python manage.py shell
  exec(open('apps/events/initial_data.py').read())
"""

import os
import django
import pytz
from datetime import datetime, timedelta

# Configuração inicial do Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cinematch.settings')
django.setup()

# Importar modelos depois da configuração do Django
from django.contrib.auth import get_user_model
from apps.events.models import Event

User = get_user_model()

def create_initial_events():
    """Função para criar eventos iniciais de teste"""
    # Verificar se já existem eventos
    if Event.objects.count() > 0:
        print('Já existem eventos no banco de dados. Pulando criação inicial.')
        return
    
    # Obter ou criar usuários
    try:
        zanon = User.objects.get(username='zanon')
        print(f'Usuário {zanon.username} encontrado.')
    except User.DoesNotExist:
        print('Usuário zanon não encontrado. Criando...')
        zanon = User.objects.create_user(
            username='zanon',
            email='zanon@example.com',
            password='password123',
            name='Zanon'
        )
    
    try:
        corno = User.objects.get(username='corno')
        print(f'Usuário {corno.username} encontrado.')
    except User.DoesNotExist:
        print('Usuário corno não encontrado. Criando...')
        corno = User.objects.create_user(
            username='corno',
            email='corno@example.com',
            password='password123',
            name='Corno'
        )
    
    try:
        robertobsousa = User.objects.get(username='robertobsousa')
        print(f'Usuário {robertobsousa.username} encontrado.')
    except User.DoesNotExist:
        print('Usuário robertobsousa não encontrado. Criando...')
        robertobsousa = User.objects.create_user(
            username='robertobsousa',
            email='roberto@example.com',
            password='password123',
            name='Roberto B. Sousa'
        )
    
    # Criar eventos
    events_data = [
        {
            'title': 'Maratona Star Wars',
            'description': 'Assista todos os filmes da saga em sequência!',
            'event_datetime': datetime.now(pytz.UTC) + timedelta(days=15),
            'location': 'Evento Virtual',
            'image': 'https://via.placeholder.com/300x150.png?text=Star+Wars',
            'owner': zanon,
            'participants': [zanon, corno, robertobsousa]
        },
        {
            'title': 'Clube do Livro: Sci-Fi',
            'description': 'Discussão sobre livros de ficção científica.',
            'event_datetime': datetime.now(pytz.UTC) + timedelta(days=5),
            'location': 'Sala 2',
            'image': 'https://via.placeholder.com/300x150.png?text=Livro',
            'owner': zanon,
            'participants': [zanon, robertobsousa]
        },
        {
            'title': 'Sessão Pipoca',
            'description': 'Filme surpresa do mês!',
            'event_datetime': datetime.now(pytz.UTC) + timedelta(days=20),
            'location': 'Evento Virtual',
            'image': 'https://via.placeholder.com/300x150.png?text=Pipoca',
            'owner': zanon,
            'participants': [zanon, corno]
        }
    ]
    
    for event_data in events_data:
        participants = event_data.pop('participants')
        event = Event.objects.create(**event_data)
        event.participants.add(*participants)
        print(f'Evento "{event.title}" criado com sucesso!')
    
    print('\nDados iniciais de eventos criados com sucesso!')

# Executar a função de criação de dados
create_initial_events()