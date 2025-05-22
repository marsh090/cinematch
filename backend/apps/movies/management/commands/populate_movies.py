import asyncio
import logging
from django.core.management.base import BaseCommand
from apps.movies.services import TMDBService
from apps.movies.models import Filme

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Popula o banco de dados com filmes do TMDB'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            default=200,
            help='Número máximo de filmes a serem buscados'
        )

    async def process_movies(self, limit):
        service = TMDBService()
        page = 1
        total_processed = 0

        while total_processed < limit:
            try:
                self.stdout.write(f"Buscando página {page}...")
                response = await service.get_popular_movies(page)
                
                # Log da resposta completa para debug
                self.stdout.write(f"Resposta da API: {response}")
                
                if not response or 'results' not in response:
                    self.stdout.write(self.style.ERROR(f"Resposta inválida da API: {response}"))
                    break

                movies = response['results']
                self.stdout.write(f"Encontrados {len(movies)} filmes na página {page}")

                for movie in movies:
                    if total_processed >= limit:
                        break

                    try:
                        # Log dos detalhes do filme
                        self.stdout.write(f"Processando filme: {movie.get('title')} (ID: {movie.get('id')})")
                        
                        # Buscar detalhes completos do filme
                        details = await service.get_movie_details(movie['id'])
                        if not details:
                            self.stdout.write(self.style.WARNING(f"Não foi possível obter detalhes para o filme {movie['id']}"))
                            continue

                        # Log dos detalhes obtidos
                        self.stdout.write(f"Detalhes obtidos para {details.get('title')}:")
                        self.stdout.write(f"- Gêneros: {[g['name'] for g in details.get('genres', [])]}")
                        self.stdout.write(f"- Data de lançamento: {details.get('release_date')}")

                        # Buscar créditos
                        credits = await service.get_movie_credits(movie['id'])
                        if not credits:
                            self.stdout.write(self.style.WARNING(f"Não foi possível obter créditos para o filme {movie['id']}"))
                            continue

                        # Log dos créditos obtidos
                        self.stdout.write(f"Créditos obtidos para {details.get('title')}:")
                        self.stdout.write(f"- Diretores: {[c['name'] for c in credits.get('crew', []) if c.get('job') == 'Director']}")
                        self.stdout.write(f"- Atores principais: {[c['name'] for c in credits.get('cast', [])[:3]]}")

                        # Criar ou atualizar o filme
                        filme, created = await Filme.objects.aupdate_or_create(
                            tmdb_id=movie['id'],
                            defaults={
                                'titulo': details['title'],
                                'sinopse': details['overview'],
                                'data_lancamento': details['release_date'],
                                'duracao': details['runtime'],
                                'poster_url': f"https://image.tmdb.org/t/p/w500{details['poster_path']}" if details['poster_path'] else None,
                                'backdrop_url': f"https://image.tmdb.org/t/p/original{details['backdrop_path']}" if details['backdrop_path'] else None,
                                'generos': [g['name'] for g in details['genres']],
                                'diretores': [c['name'] for c in credits['crew'] if c['job'] == 'Director'],
                                'atores_principais': [c['name'] for c in credits['cast'][:5]],
                                'nota_media': details['vote_average'],
                                'total_votos': details['vote_count'],
                                'status': details['status'],
                                'idioma_original': details['original_language'],
                                'orcamento': details['budget'],
                                'receita': details['revenue'],
                                'tagline': details['tagline'],
                                'site_oficial': details['homepage'],
                                'video': details['video'],
                                'adulto': details['adult'],
                            }
                        )

                        if created:
                            self.stdout.write(self.style.SUCCESS(f"Filme criado: {filme.titulo}"))
                        else:
                            self.stdout.write(self.style.SUCCESS(f"Filme atualizado: {filme.titulo}"))

                        total_processed += 1

                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"Erro ao processar filme {movie.get('id')}: {str(e)}"))
                        continue

                page += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Erro ao processar página {page}: {str(e)}"))
                break

        self.stdout.write(self.style.SUCCESS(f"Processamento concluído! {total_processed} filmes processados."))

    def handle(self, *args, **options):
        limit = options['limit']
        asyncio.run(self.process_movies(limit)) 