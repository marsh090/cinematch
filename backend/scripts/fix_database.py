from django.core.management.base import BaseCommand
from apps.communities.models import Chat, ChatType

class Command(BaseCommand):
    help = 'Fix database integrity issues related to ChatType references.'

    def handle(self, *args, **kwargs):
        # Ensure ChatType entries exist
        chat_types = ['text', 'calendar', 'poll']
        for chat_type in chat_types:
            ChatType.objects.get_or_create(name=chat_type, defaults={'description': f'{chat_type.capitalize()} chat'})

        # Correct Chat references
        for chat in Chat.objects.all():
            if not chat.chat_type:
                chat.chat_type = ChatType.objects.filter(name='text').first()
                chat.save()

        self.stdout.write(self.style.SUCCESS('Database integrity issues fixed.')) 