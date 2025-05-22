import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

function Footer() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: '#1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Typography variant="h6" color="white">
        CineMatch
      </Typography>
      <Typography variant="body2" color="gray">
        © 2024 CineMatch. Todos os direitos reservados.
      </Typography>
      <IconButton
        onClick={scrollToTop}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          },
        }}
      >
        <KeyboardArrowUpIcon sx={{ color: 'white' }} />
      </IconButton>
    </Box>
  );
}

export default Footer; 