npm install -g yarn# Cinematch

Cinematch é uma plataforma social de filmes que conecta usuários através de suas preferências cinematográficas, oferecendo recomendações personalizadas e comunidades de discussão.

## Funcionalidades

- Cadastro e autenticação de usuários
- Recomendações de filmes baseadas em IA (Gemini 2.0)
- Comunidades de discussão com chat em tempo real
- Perfil personalizado com histórico de filmes
- Sistema de avaliação e reviews

## Tecnologias Utilizadas

### Backend
- Django REST Framework
- PostgreSQL (Supabase)
- Python 3.11+
- Poetry para gerenciamento de dependências

### Frontend
- React
- Material-UI
- Socket.io para chat em tempo real
- Yarn para gerenciamento de dependências

## Estrutura do Projeto

```
cinematch/
├── backend/                 # Django REST API
│   ├── cinematch/          # Projeto Django principal
│   ├── apps/               # Aplicações Django
│   └── requirements/       # Arquivos de requisitos
├── frontend/               # Aplicação React
│   ├── src/
│   └── public/
└── docs/                   # Documentação
```

## Configuração do Ambiente de Desenvolvimento

### Backend

1. Instale o Poetry:
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

2. Instale as dependências:
```bash
cd backend
poetry install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### Frontend

1. Instale o Yarn:
```bash
npm install -g yarn
```

2. Instale as dependências:
```bash
cd frontend
yarn install
```

## Executando o Projeto

### Backend
```bash
cd backend
poetry run python manage.py runserver
```

### Frontend
```bash
cd frontend
yarn start
```

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes. 