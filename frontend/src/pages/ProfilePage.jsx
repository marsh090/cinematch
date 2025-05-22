import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Snackbar, Alert } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';

function ProfilePage() {
  const { username } = useParams();
  const [stats, setStats] = useState({ assistidos: 0, likes: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`http://localhost:8000/api/movies/user_stats/${username}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        return res.json();
      })
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setStats(data);
        }
      })
      .catch(error => {
        console.error('Error fetching user stats:', error);
        setError('Erro ao carregar estatísticas do usuário');
      })
      .finally(() => setLoading(false));
  }, [username, token]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', background: '#161718' }}>
        <Header />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#161718', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Box sx={{ flex: 1, p: 4 }}>
        <Typography variant="h3" sx={{ mb: 4, color: 'white' }}>Perfil de {username}</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
          <Box sx={{ p: 3, background: '#23242a', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: 'white' }}>{stats.assistidos}</Typography>
            <Typography variant="body1" sx={{ color: 'gray' }}>Assistidos</Typography>
          </Box>
          <Box sx={{ p: 3, background: '#23242a', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: 'white' }}>{stats.likes}</Typography>
            <Typography variant="body1" sx={{ color: 'gray' }}>Likes</Typography>
          </Box>
          <Box sx={{ p: 3, background: '#23242a', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: 'white' }}>0</Typography>
            <Typography variant="body1" sx={{ color: 'gray' }}>Críticas</Typography>
          </Box>
          <Box sx={{ p: 3, background: '#23242a', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: 'white' }}>0</Typography>
            <Typography variant="body1" sx={{ color: 'gray' }}>Seguidores</Typography>
          </Box>
          <Box sx={{ p: 3, background: '#23242a', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: 'white' }}>0</Typography>
            <Typography variant="body1" sx={{ color: 'gray' }}>Seguindo</Typography>
          </Box>
        </Box>
      </Box>
      <Footer />
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
    </Box>
  );
}

export default ProfilePage; 