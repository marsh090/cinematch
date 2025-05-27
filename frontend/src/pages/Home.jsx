import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  TextField,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Rating,
  Snackbar,
  Alert,
  CircularProgress,
  Button,
  IconButton,
  Paper,
} from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ReactMarkdown from 'react-markdown';

// Constantes para as URLs da API
const API_URL = 'http://localhost:8000/api';
const GEMINI_URL = 'https://movie-system-ai-service.vercel.app';

function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const fetchMovies = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/movies/?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        throw new Error('Erro ao carregar filmes');
      }

      const data = await response.json();
      
      if (page === 1) {
        setMovies(data.results || []);
      } else {
        setMovies(prev => [...prev, ...(data.results || [])]);
      }
      
      setHasMore(data.next !== null);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar filmes:', error);
      setError(error.message);
      setShowError(true);
      setLoading(false);
    }
  }, [page, token, navigate]);

  useEffect(() => {
    if (token) {
      fetchMovies();
    }
  }, [fetchMovies, token]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setAiLoading(true);
    try {
      const response = await fetch(`${GEMINI_URL}/responder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pergunta: searchQuery
        })
      });

      if (!response.ok) {
        throw new Error('Erro na resposta da IA');
      }

      const data = await response.json();
      if (!data || !data.resposta) {
        throw new Error('Resposta inválida da IA');
      }
      
      setAiResponse(data);
      setSearchQuery('');
      setSnackbar({ open: true, message: 'Resposta da IA recebida', severity: 'success' });
    } catch (error) {
      console.error('Erro ao consultar IA:', error);
      setSnackbar({ 
        open: true, 
        message: 'Erro ao consultar a IA. Por favor, tente novamente.', 
        severity: 'error' 
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleScroll = useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || loading || !hasMore) return;
    setPage(prev => prev + 1);
  }, [loading, hasMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (!token) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box
        sx={{
          flex: 1,
          backgroundColor: '#121212',
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 6,
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Pergunte sobre filmes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                maxWidth: 800,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{
                ml: 2,
                fontWeight: 700,
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
              disabled={aiLoading}
            >
              {aiLoading ? <CircularProgress size={24} /> : <SearchIcon />}
            </Button>
          </Box>

          {aiResponse && (
            <Paper 
              elevation={3}
              sx={{ 
                mt: 2, 
                p: 3, 
                background: '#23242a', 
                borderRadius: 2, 
                maxWidth: 800, 
                mx: 'auto',
                color: 'white',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  Resposta da IA
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => setAiResponse(null)}
                  sx={{ color: 'white' }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box sx={{ 
                '& p': { mb: 2 },
                '& ul': { pl: 3, mb: 2 },
                '& li': { mb: 1 },
                '& strong': { color: 'primary.main' },
                '& em': { color: 'primary.light' },
                '& h1, & h2, & h3, & h4, & h5, & h6': { 
                  color: 'primary.main',
                  mt: 2,
                  mb: 1
                },
                '& code': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  padding: '2px 4px',
                  borderRadius: 1,
                  fontFamily: 'monospace'
                },
                '& blockquote': {
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                  pl: 2,
                  py: 1,
                  my: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)'
                }
              }}>
                <ReactMarkdown>
                  {aiResponse.resposta}
                </ReactMarkdown>
              </Box>
            </Paper>
          )}

          <Box sx={{ mt: 4 }}>
            <Typography variant="h4" sx={{ mb: 3, color: 'white' }}>Filmes em Destaque</Typography>
            
            {loading && page === 1 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : movies.length > 0 ? (
              <Grid container spacing={3}>
                {movies.map((movie) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={movie.id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: '#1a1a1a',
                        transition: 'transform 0.2s',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'scale(1.02)',
                        },
                      }}
                      onClick={() => navigate(`/movie/${movie.id}`)}
                    >
                      <CardMedia
                        component="img"
                        height="400"
                        image={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={movie.titulo}
                      />
                      <CardContent>
                        <Typography
                          gutterBottom
                          variant="h6"
                          component="div"
                          sx={{ color: 'white' }}
                        >
                          {movie.titulo}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Rating
                            value={movie.avaliacao_media / 2}
                            precision={0.5}
                            readOnly
                            size="small"
                          />
                          <Typography
                            variant="body2"
                            sx={{ ml: 1, color: 'gray' }}
                          >
                            ({movie.avaliacao_media.toFixed(1)})
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          color="gray"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {movie.sinopse}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="h6" sx={{ textAlign: 'center', color: 'gray' }}>
                Nenhum filme encontrado
              </Typography>
            )}

            {loading && page > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            )}
          </Box>
        </Container>
      </Box>
      <Footer />
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
      >
        <Alert
          onClose={() => setShowError(false)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Home; 