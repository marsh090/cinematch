import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LandingHeader from '../components/LandingHeader';
import Footer from '../components/Footer';

function Landing() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(localStorage.getItem('token'));
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #161718 0%, #2d2e2f 100%)' }}>
      <LandingHeader />
      <Container maxWidth="md" sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
        <Typography variant="h2" sx={{ color: 'white', fontWeight: 800, mb: 2, textAlign: 'center', fontSize: { xs: 32, md: 44 } }}>
          Sua comunidade de cinéfilos
        </Typography>
        <Typography variant="body1" sx={{ color: 'white', fontSize: 22, mb: 5, textAlign: 'center', maxWidth: 600 }}>
          Descubra, discuta e compartilhe sua paixão por filmes com pessoas que amam cinema tanto quanto você.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={{ fontWeight: 700, fontSize: 22, px: 5, py: 1.5, borderRadius: 3, boxShadow: 3 }}
          onClick={() => isAuthenticated ? navigate('/home') : navigate('/register')}
        >
          Comece Agora &rarr;
        </Button>
      </Container>
      <Footer />
    </Box>
  );
}

export default Landing; 