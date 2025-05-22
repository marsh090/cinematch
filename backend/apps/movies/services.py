import aiohttp
import asyncio
from datetime import datetime
from django.conf import settings
from .models import Filme

class TMDBService:
    def __init__(self):
        self.api_key = "41036b9ae80b5afca7620600a601bdf3"
        self.base_url = "https://api.themoviedb.org/3"
        self.headers = {
            "accept": "application/json"
        }
    
    async def get_popular_movies(self, page=1):
        async with aiohttp.ClientSession() as session:
            url = f"{self.base_url}/movie/popular?api_key={self.api_key}&page={page}"
            async with session.get(url, headers=self.headers) as response:
                if response.status != 200:
                    print(f"Erro na API: {response.status} - {await response.text()}")
                    return None
                return await response.json()
    
    async def get_movie_details(self, movie_id):
        async with aiohttp.ClientSession() as session:
            url = f"{self.base_url}/movie/{movie_id}?api_key={self.api_key}"
            async with session.get(url, headers=self.headers) as response:
                if response.status != 200:
                    print(f"Erro na API: {response.status} - {await response.text()}")
                    return None
                return await response.json()
    
    async def get_movie_credits(self, movie_id):
        async with aiohttp.ClientSession() as session:
            url = f"{self.base_url}/movie/{movie_id}/credits?api_key={self.api_key}"
            async with session.get(url, headers=self.headers) as response:
                if response.status != 200:
                    print(f"Erro na API: {response.status} - {await response.text()}")
                    return None
                return await response.json()

    async def process_movie(self, movie_id):
        try:
            details = await self.get_movie_details(movie_id)
            credits = await self.get_movie_credits(movie_id)
            
            # Processa diretor
            director = next(
                (crew['name'] for crew in credits['crew'] 
                 if crew['job'] == 'Director'),
                None
            )
            
            # Processa elenco (top 5 atores)
            cast = [
                actor['name'] for actor in credits['cast'][:5]
            ]
            
            # Processa gêneros
            genres = [
                genre['name'] for genre in details['genres']
            ]
            
            # Cria ou atualiza o filme
            filme, created = await asyncio.to_thread(
                Filme.objects.update_or_create,
                tmdb_id=details['id'],
                defaults={
                    'titulo': details['title'],
                    'sinopse': details['overview'],
                    'diretor': director,
                    'elenco': cast,
                    'genero': genres,
                    'avaliacao_media': details['vote_average'],
                    'poster_path': details['poster_path'],
                    'backdrop_path': details['backdrop_path'],
                    'data_lancamento': datetime.strptime(
                        details['release_date'], 
                        '%Y-%m-%d'
                    ).date() if details['release_date'] else None
                }
            )
            
            return filme, created
            
        except Exception as e:
            print(f"Erro ao processar filme {movie_id}: {str(e)}")
            return None, False 