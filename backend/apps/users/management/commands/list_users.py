from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Lista todos os usuários do banco de dados'

    def handle(self, *args, **options):
        users = User.objects.all()
        
        if not users:
            self.stdout.write(self.style.WARNING('Nenhum usuário encontrado no banco de dados.'))
            return

        self.stdout.write(self.style.SUCCESS(f'Total de usuários: {users.count()}\n'))
        
        for user in users:
            self.stdout.write(f'ID: {user.id}')
            self.stdout.write(f'Username: {user.username}')
            self.stdout.write(f'Email: {user.email}')
            self.stdout.write(f'Nome: {user.name}')
            self.stdout.write(f'É superuser: {user.is_superuser}')
            self.stdout.write(f'É staff: {user.is_staff}')
            self.stdout.write('-' * 50) 