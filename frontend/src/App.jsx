import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './components/Login';
import Register from './components/Register';
import Home from './pages/Home';
import Landing from './pages/Landing';
import MoviePage from './pages/MoviePage';
import UserProfile from './pages/UserProfile';
import CalendarioPage from './pages/CalendarioPage';
import ComunidadesPage from './pages/ComunidadesPage';
import theme from './theme';
import axios from 'axios';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const isAuthenticated = Boolean(localStorage.getItem('token'));

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const response = await axios.get('http://localhost:8000/api/users/me/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setCurrentUser(response.data);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    if (isAuthenticated) {
      fetchCurrentUser();
    }
  }, [isAuthenticated]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/landing" element={<Landing />} />
        <Route
          path="/"
          element={
            isAuthenticated ? <PrivateRoute><Home /></PrivateRoute> : <Landing />
          }
        />
        <Route
          path="/home"
          element={<PrivateRoute><Home /></PrivateRoute>}
        />
        <Route path="/movie/:id" element={<PrivateRoute><MoviePage /></PrivateRoute>} />
        <Route path="/profile/:username" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
        <Route path="/calendario" element={<PrivateRoute><CalendarioPage /></PrivateRoute>} />
        <Route path="/comunidades" element={<PrivateRoute><ComunidadesPage currentUser={currentUser} /></PrivateRoute>} />
        <Route path="/comunidades/:id" element={<PrivateRoute><ComunidadesPage currentUser={currentUser} /></PrivateRoute>} />
      </Routes>
    </ThemeProvider>
  );
}

export default App; 