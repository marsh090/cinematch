import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button, Avatar } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/cinema_1.png';

function LandingHeader() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(localStorage.getItem('token'));

  const handleEntrar = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      navigate('/home');
    } else {
      navigate('/login');
    }
  };

  const handleCadastrar = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/register');
  };

  return (
    <AppBar position="static" color="default" elevation={2} sx={{ background: '#181c24' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Esquerda: Logo + Nome */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar src={logo} alt="CineMatch Logo" sx={{ width: 40, height: 40, mr: 1 }} />
          <Typography
            variant="h6"
            color="white"
            sx={{ fontWeight: 700, letterSpacing: 1, textDecoration: 'none' }}
            component={Link}
            to="/landing"
          >
            CineMatch
          </Typography>
        </Box>
        {/* Centro vazio */}
        <Box sx={{ flex: 1 }} />
        {/* Direita: Entrar/Cadastrar */}
        <Box>
          <Button
            color="primary"
            variant="text"
            sx={{ mr: 2, fontWeight: 700 }}
            onClick={handleEntrar}
          >
            Entrar
          </Button>
          <Button
            color="primary"
            variant="contained"
            sx={{ fontWeight: 700 }}
            onClick={handleCadastrar}
          >
            Cadastrar
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default LandingHeader; 