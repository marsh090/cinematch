# Cinematch Backend

Backend do projeto Cinematch, um sistema de comunidades para discussão de filmes.

## Requisitos

- Python 3.11+
- Poetry

## Instalação

1. Clone o repositório
2. Entre na pasta do backend
3. Instale as dependências com Poetry:
```bash
poetry install
```

4. Aplique as migrações:
```bash
poetry run python manage.py migrate
```

5. Rode o servidor:
```bash
poetry run python manage.py runserver
```

## Estrutura do Projeto

O projeto está organizado em apps Django:

- `apps/communities`: Sistema de comunidades e chats
- `apps/movies`: Sistema de filmes e avaliações
- `apps/events`: Sistema de eventos

## Desenvolvimento

Para adicionar novas dependências:

```bash
poetry add nome-do-pacote
``` 