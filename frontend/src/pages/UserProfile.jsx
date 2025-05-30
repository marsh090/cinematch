import React, { useEffect, useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  Button,
  IconButton,
  Tabs,
  Tab,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  Paper,
  Link as MuiLink,
  Grid,
  Stack,
  Modal,
  TextField,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import CheckIcon from '@mui/icons-material/Check';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ImageIcon from '@mui/icons-material/Image';

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=1200&q=80';
const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=333&color=fff&size=256';

function UserProfile() {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [movies, setMovies] = useState([]);
  const [comments, setComments] = useState([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [bannerUrl, setBannerUrl] = useState(null);
  const [userStats, setUserStats] = useState({ assistidos: 0, likes: 0 });
  const [openModal, setOpenModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageType, setImageType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
  });
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const API_URL = 'http://localhost:8000/api';

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/users/${username}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Erro ao buscar perfil');
        const data = await res.json();
        setUser(data);
        setIsOwnProfile(localStorage.getItem('username') === data.username);
        setIsFollowing(data.is_following || false);
        setAvatarUrl(data.avatar_url || DEFAULT_AVATAR);
        setBannerUrl(data.banner_url || DEFAULT_BANNER);
      } catch (e) {
        setUser(null);
        setAvatarUrl(DEFAULT_AVATAR);
        setBannerUrl(DEFAULT_BANNER);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [username, token]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    let filtro = ['assistidos', 'favoritos', 'assistir_depois'][tab];
    async function fetchData() {
      try {
        if (tab === 3) {
          const res = await fetch(`${API_URL}/forum/?user=${username}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          setComments(data.results || []);
        } else {
          const res = await fetch(`${API_URL}/users/${username}/movies/?filtro=${filtro}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          setMovies(data || []);
        }
      } catch (e) {
        console.error('Error fetching data:', e);
        setMovies([]);
        setComments([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, tab, username, token]);

  useEffect(() => {
    async function fetchUserStats() {
      try {
        const res = await fetch(`${API_URL}/movies/user_stats/${username}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Erro ao buscar estatísticas');
        const data = await res.json();
        setUserStats(data);
      } catch (e) {
        setUserStats({ assistidos: 0, likes: 0 });
      }
    }
    fetchUserStats();
  }, [username, token]);

  const handleFollow = async () => {
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`${API_URL}/users/${username}/follow/`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const userRes = await fetch(`${API_URL}/users/${username}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userRes.json();
        setUser(userData);
        setIsFollowing(userData.is_following || false);
        const statsRes = await fetch(`${API_URL}/movies/user_stats/${username}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statsData = await statsRes.json();
        setUserStats(statsData);
      }
    } catch {}
  };

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const goToProfile = (uname) => {
    navigate(`/profile/${uname}`);
  };

  const handleOpenModal = (type) => {
    setImageType(type);
    setSelectedImage(null);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedImage(null);
    setImageType(null);
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      setSelectedImage(file);
    } else {
      alert('Por favor, selecione uma imagem JPG ou PNG válida.');
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', selectedImage);
    formData.append('type', imageType);

    try {
      const res = await fetch(`${API_URL}/users/${username}/upload-image/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        if (imageType === 'avatar') {
          setAvatarUrl(updatedUser.avatar_url || DEFAULT_AVATAR);
        } else {
          setBannerUrl(updatedUser.banner_url || DEFAULT_BANNER);
        }
        handleCloseModal();
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao fazer upload da imagem');
      }
    } catch (error) {
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/users/${username}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        handleCloseModal();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (username === 'testuser') {
    return (
      <Box sx={{ minHeight: '100vh', background: '#18191A', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Header />
        <Typography variant="h3" sx={{ mt: 10 }}>Perfil de Teste: {username}</Typography>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#18191A', color: 'white', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Box sx={{ position: 'relative', height: { xs: 120, sm: 180, md: 240 }, background: `url(${bannerUrl}) center/cover`, mb: { xs: -8, sm: -10, md: -12 } }}>
        <Avatar
          src={avatarUrl}
          alt={user?.nome}
          sx={{
            width: { xs: 96, sm: 128, md: 160 },
            height: { xs: 96, sm: 128, md: 160 },
            position: 'absolute',
            left: { xs: 16, sm: 40 },
            bottom: { xs: -48, sm: -64, md: -80 },
            border: '6px solid #18191A',
            fontSize: 36,
            bgcolor: '#444',
            cursor: isOwnProfile ? 'pointer' : 'default',
            boxShadow: 3,
          }}
        >
          Foto
        </Avatar>
        {isOwnProfile && (
          <Box sx={{ position: 'absolute', right: 32, top: 32, display: 'flex', gap: 1 }}>
            <IconButton sx={{ bgcolor: '#23242a' }} onClick={() => handleOpenModal('avatar')}>
              <EditIcon sx={{ color: 'white' }} />
            </IconButton>
            <IconButton sx={{ bgcolor: '#23242a' }} onClick={() => handleOpenModal('banner')}>
              <ImageIcon sx={{ color: 'white' }} />
            </IconButton>
          </Box>
        )}
      </Box>
      <Box sx={{ mt: { xs: 7, sm: 10, md: 13 }, px: { xs: 2, sm: 4 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 4, maxWidth: 1200, mx: 'auto', width: '100%' }}>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Typography variant="h5" fontWeight={700} sx={{ wordBreak: 'break-word' }}>{user?.name || user?.nome || 'Nome'}</Typography>
          <MuiLink component="button" color="primary" underline="hover" sx={{ fontSize: 18 }} onClick={() => goToProfile(user?.username)}>
            @{user?.username || 'Nome'}
          </MuiLink>
          <Typography variant="body1" sx={{ mt: 1, wordBreak: 'break-word' }}>{user?.bio || ' '}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: { xs: 2, sm: 0 } }}>
          {!isOwnProfile && (
            <Button
              variant={isFollowing ? 'contained' : 'outlined'}
              color="primary"
              startIcon={isFollowing ? <CheckIcon /> : <PersonAddAlt1Icon />}
              onClick={handleFollow}
              sx={{ borderRadius: 8, fontWeight: 700, minWidth: 120 }}
            >
              {isFollowing ? 'Seguindo' : 'Seguir'}
            </Button>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 2, sm: 6 }, mt: 3, mb: 2, flexWrap: 'wrap' }}>
        <Box sx={{ textAlign: 'center', minWidth: 80 }}>
          <Typography variant="h6" fontWeight={700}>{userStats.assistidos}</Typography>
          <Typography variant="body2" color="gray">Assistidos</Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: 80 }}>
          <Typography variant="h6" fontWeight={700}>{userStats.criticas ?? 0}</Typography>
          <Typography variant="body2" color="gray">Críticas</Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: 80 }}>
          <Typography variant="h6" fontWeight={700}>{userStats.likes}</Typography>
          <Typography variant="body2" color="gray">Likes</Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: 80 }}>
          <Typography variant="h6" fontWeight={700}>{userStats.seguidores ?? 0}</Typography>
          <Typography variant="body2" color="gray">Seguidores</Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: 80 }}>
          <Typography variant="h6" fontWeight={700}>{userStats.seguindo ?? 0}</Typography>
          <Typography variant="body2" color="gray">Seguindo</Typography>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
        <Tabs value={tab} onChange={handleTabChange} textColor="inherit" indicatorColor="primary">
          <Tab label="Assistidos" />
          <Tab label="Favoritos" />
          <Tab label="Assistir depois" />
          <Tab label="Comentários" />
        </Tabs>
      </Box>
      <Box sx={{ flex: 1, px: { xs: 1, sm: 4 }, pb: 4, maxWidth: 1200, mx: 'auto', width: '100%' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <CircularProgress />
          </Box>
        ) : tab === 3 ? (
          <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>Comentários</Typography>
            {comments.length === 0 ? (
              <Typography color="gray">Nenhum comentário encontrado.</Typography>
            ) : (
              comments.map((comment) => (
                <Paper key={comment.id} sx={{ mb: 2, p: 2, background: '#23242a' }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ cursor: 'pointer' }} onClick={() => navigate(`/movie/${comment.filme}`)}>
                      {comment.filme_titulo || 'Filme'}
                    </Typography>
                    <Typography variant="caption" color="gray">{new Date(comment.created_at).toLocaleString()}</Typography>
                  </Stack>
                  <Typography sx={{ mt: 1 }}>{comment.texto}</Typography>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                    <IconButton size="small"><ThumbUpIcon fontSize="small" /></IconButton>
                    <Typography variant="caption">{comment.likes_count}</Typography>
                  </Stack>
                </Paper>
              ))
            )}
          </Box>
        ) : (
          <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>Filmes</Typography>
            {movies.length === 0 ? (
              <Typography color="gray">Nenhum filme encontrado.</Typography>
            ) : (
              <Grid container spacing={3}>
                {movies.map((movie) => (
                  <Grid item key={movie.id} xs={12} sm={6} md={4} lg={3}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        background: '#23242a',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'scale(1.03)',
                          boxShadow: 3
                        }
                      }} 
                      onClick={() => navigate(`/movie/${movie.id}`)}
                    >
                      <CardMedia
                        component="img"
                        height="400"
                        image={movie.poster_path}
                        alt={movie.titulo}
                        sx={{ 
                          objectFit: 'cover',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
                        }}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography 
                          gutterBottom 
                          variant="h6" 
                          component="div"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {movie.titulo}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(movie.data_lancamento).getFullYear()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Box>
      <Footer />

      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="upload-image-modal"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{
          bgcolor: '#23242a',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          width: '100%',
          maxWidth: 500,
          mx: 2,
        }}>
          <Typography variant="h6" component="h2" sx={{ mb: 3, color: 'white' }}>
            {imageType === 'avatar' ? 'Alterar Foto de Perfil' : 'Alterar Banner'}
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <input
              accept="image/jpeg,image/png"
              style={{ display: 'none' }}
              id="image-upload"
              type="file"
              onChange={handleImageSelect}
            />
            <label htmlFor="image-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'gray' } }}
              >
                Selecionar Imagem
              </Button>
            </label>
            {selectedImage && (
              <Typography sx={{ mt: 2, color: 'white' }}>
                Arquivo selecionado: {selectedImage.name}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={handleCloseModal} sx={{ color: 'gray' }}>
              Cancelar
            </Button>
            <Button
              onClick={handleImageUpload}
              variant="contained"
              color="primary"
              disabled={!selectedImage || uploading}
            >
              {uploading ? <CircularProgress size={24} /> : 'Enviar'}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}

export default UserProfile;