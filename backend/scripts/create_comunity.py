from django.contrib.auth import get_user_model
from apps.communities.models import Community, Chat, ChatType, TextMessage

# Replace 'your_username' with your actual username
username = 'zanon'

# Get the user object
User = get_user_model()
user = User.objects.get(username=username)

# Create a community
community = Community.objects.create(
    name='Comunidade de teste',
    description='Descrição aleatória da comunidade de teste bliblibli blobloblo',
    owner=user
)

# Create a chat type for text
chat_type, created = ChatType.objects.get_or_create(name='text', description='Text chat')

# Create a chat in the community
chat = Chat.objects.create(
    name='General Chat',
    community=community,
    chat_type=chat_type
)

# Optionally, create a text message in the chat
text_message = TextMessage.objects.create(
    content='Welcome to the chat!',
    user=user,
    chat=chat
)

print(f"Community '{community.name}' with chat '{chat.name}' created successfully.")