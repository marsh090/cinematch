import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './components/Login';
import Register from './components/Register';
import Home from './pages/Home';
import Landing from './pages/Landing';
import MoviePage from './pages/MoviePage';
import UserProfile from './pages/UserProfile';
import theme from './theme';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  const isAuthenticated = Boolean(localStorage.getItem('token'));
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
      </Routes>
    </ThemeProvider>
  );
}

export default App; 