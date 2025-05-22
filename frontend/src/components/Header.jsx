import React, { useRef, useState } from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Button, Stack, Avatar } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/cinema_1.png';

const navLinks = [
  { label: 'Início', path: '/' },
  { label: 'Calendário', path: '/calendario' },
  { label: 'Comunidades', path: '/comunidades' },
];

function Header() {
  const location = useLocation();
  const [isShaking, setIsShaking] = useState(false);
  const iconRef = useRef(null);
  const navigate = useNavigate();
  const isAuthenticated = Boolean(localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username') || null);

  const handleLogoClick = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 800); // duração da animação
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/landing');
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      fetch('http://localhost:8000/api/users/me/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.username) {
            setUsername(data.username);
            localStorage.setItem('username', data.username);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  return (
    <AppBar position="static" color="default" elevation={2} sx={{ background: '#181c24' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Esquerda: Logo + Nome */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            ref={iconRef}
            src={logo}
            alt="CineMatch Logo"
            sx={{
              width: 40,
              height: 40,
              mr: 1,
              cursor: 'pointer',
              transition: 'transform 0.8s cubic-bezier(.36,.07,.19,.97)',
              ...(isShaking && {
                animation: 'shake-cinematch 0.8s cubic-bezier(.36,.07,.19,.97)',
              }),
            }}
            onClick={handleLogoClick}
          />
          <Typography
            variant="h6"
            color="white"
            sx={{ fontWeight: 700, letterSpacing: 1, cursor: 'pointer', textDecoration: 'none' }}
            component={Link}
            to="/landing"
          >
            CineMatch
          </Typography>
        </Box>

        {/* Centro: Links */}
        <Stack direction="row" spacing={3} sx={{ flex: 1, justifyContent: 'center' }}>
          {navLinks.map((link) => (
            <Button
              key={link.path}
              component={Link}
              to={link.path}
              sx={{
                color: location.pathname === link.path ? 'primary.main' : 'white',
                fontWeight: location.pathname === link.path ? 700 : 400,
                fontSize: '1rem',
                textTransform: 'none',
                borderBottom: location.pathname === link.path ? '2px solid #4b80ca' : 'none',
                borderRadius: 0,
                px: 2,
              }}
            >
              {link.label}
            </Button>
          ))}
        </Stack>

        {/* Direita: Notificações, Perfil e Sair */}
        <Box>
          <IconButton color="inherit">
            <NotificationsIcon sx={{ color: 'white' }} />
          </IconButton>
          {isAuthenticated && (
            <IconButton
              color="primary"
              sx={{ ml: 2, fontSize: 32 }}
              onClick={() => navigate(`/profile/${username || 'me'}`)}
            >
              <AccountCircleIcon sx={{ fontSize: 32 }} />
            </IconButton>
          )}
          {isAuthenticated && (
            <Button
              color="error"
              variant="text"
              sx={{ ml: 2, fontWeight: 700, fontSize: 16, border: 'none', minWidth: 0, p: 0 }}
              onClick={handleLogout}
            >
              Sair
            </Button>
          )}
        </Box>
      </Toolbar>
      {/* Animação CSS global para o balanço */}
      <style>{`
        @keyframes shake-cinematch {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(-18deg); }
          20% { transform: rotate(15deg); }
          30% { transform: rotate(-12deg); }
          40% { transform: rotate(9deg); }
          50% { transform: rotate(-6deg); }
          60% { transform: 3deg; }
          70% { transform: -2deg; }
          80% { transform: 1deg; }
          90% { transform: 0deg; }
          100% { transform: 0deg; }
        }
      `}</style>
    </AppBar>
  );
}

export default Header; 