import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Tooltip,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import Header from '../components/Header';
import PropTypes from 'prop-types';
import ChatPage from './ChatPage';

const ComunidadesPage = ({ currentUser }) => {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [publicCommunities, setPublicCommunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creatingCommunity, setCreatingCommunity] = useState(false);
  const [communityFormData, setCommunityFormData] = useState({
    name: '',
    description: '',
    is_public: true,
    image: null,
    imagePreview: null
  });
  const [formErrors, setFormErrors] = useState({});
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [newChatData, setNewChatData] = useState({ name: '', type: '' });

  const username = localStorage.getItem('username');

  const getAccessToken = async () => {
    let token = localStorage.getItem('token');
    console.log('Retrieved token from local storage:', token);
    const refreshToken = localStorage.getItem('refresh_token');

    // Check if the access token is expired
    const isTokenExpired = (token) => {
        if (!token) return true;
        const [, payload] = token.split('.');
        const decodedPayload = JSON.parse(atob(payload));
        return decodedPayload.exp * 1000 < Date.now();
    };

    if (isTokenExpired(token) && refreshToken) {
        try {
            const response = await axios.post('http://localhost:8000/api/token/refresh/', {
                refresh: refreshToken
            });
            token = response.data.access;
            localStorage.setItem('token', token);
            console.log('Refreshed token:', token);
        } catch (error) {
            console.error('Error refreshing access token:', error);
            return null;
        }
    }

    return token;
  };

  const fetchCommunities = async () => {
    setLoading(true);
    try {
        const token = await getAccessToken();
        console.log('Using token for fetching communities:', token);
        if (!token) throw new Error('Failed to get access token');

        const userUUID = await fetchUserUUID(username);
        if (!userUUID) throw new Error('Failed to fetch user UUID');

        const response = await axios.get('http://localhost:8000/api/communities/', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const filteredCommunities = response.data.filter(community =>
            community.is_public || community.members.includes(userUUID)
        );

        setCommunities(filteredCommunities);
    } catch (error) {
        console.error('Error fetching communities:', error);
    } finally {
        setLoading(false);
    }
  };

  const fetchUserUUID = async (username) => {
    const token = await getAccessToken();
    console.log('Access token for fetching UUID:', token);
    if (!token) {
      console.log('No access token available');
      return null;
    }
    try {
      const response = await axios.get(`http://localhost:8000/api/users/uuid-by-username/${username}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('UUID fetch response:', response);
      return response.data.uuid;
    } catch (error) {
      console.error('Error fetching user UUID:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  useEffect(() => {
    setSelectedChat(null);
  }, [selectedCommunity]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredCommunities = communities.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPublicCommunities = publicCommunities.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCommunityFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleCreateCommunity = async () => {
    console.log('Create Community button clicked');
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setCreatingCommunity(true);
    console.log('Creating community...');

    try {
      const userUUID = await fetchUserUUID(username);
      if (!userUUID) throw new Error('Failed to fetch user UUID');

      console.log('User UUID:', userUUID);

      const formData = new FormData();
      formData.append('name', communityFormData.name);
      formData.append('description', communityFormData.description);
      formData.append('is_public', communityFormData.is_public);
      formData.append('owner', userUUID);
      formData.append('members', userUUID);

      if (communityFormData.image) {
        formData.append('icon', communityFormData.image);
      }

      const token = await getAccessToken();
      if (!token) throw new Error('Failed to get access token');

      console.log('Access token:', token);

      await axios.post('http://localhost:8000/api/communities/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Community created successfully');

      setCreateDialogOpen(false);
      setCommunityFormData({
        name: '',
        description: '',
        is_public: true,
        image: null,
        imagePreview: null
      });
      fetchCommunities();
    } catch (error) {
      console.error('Error creating community:', error);
    } finally {
      setCreatingCommunity(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!communityFormData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    if (!communityFormData.description.trim()) {
      errors.description = 'Descrição é obrigatória';
    } else if (communityFormData.description.length > 200) {
      errors.description = 'Descrição deve ter no máximo 200 caracteres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchChats = async (communityId) => {
    console.log('Fetching chats for community ID:', communityId);
    const token = await getAccessToken();
    if (!token) return;
    try {
        const response = await axios.get(`http://localhost:8000/api/communities/${communityId}/chats/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        setChats(response.data);
    } catch (error) {
        console.error('Error fetching chats:', error);
    }
  };

  const handleCommunityClick = (community) => {
    console.log('Selected community:', community);
    setSelectedCommunity(community);
    fetchChats(community.id);
  };

  const handleOpenChatDialog = () => {
    setChatDialogOpen(true);
  };

  const handleChatFormChange = (e) => {
    const { name, value } = e.target;
    setNewChatData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateChat = async () => {
    const token = await getAccessToken();
    if (!token) return;
    try {
      await axios.post(`http://localhost:8000/api/communities/${selectedCommunity.id}/chats/`, newChatData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setChatDialogOpen(false);
      setNewChatData({ name: '', type: '' });
      fetchChats(selectedCommunity.id);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleAddMember = async (username) => {
    if (!selectedCommunity) return;
    const token = await getAccessToken();
    if (!token) return;
    try {
        await axios.post(`http://localhost:8000/api/communities/${selectedCommunity.id}/add-member/`, {
            username: username
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        alert('Member added successfully');
    } catch (error) {
        console.error('Error adding member:', error);
        alert('Failed to add member');
    }
  };

  const handleDeleteCommunity = async () => {
    if (!selectedCommunity) return;
    const token = await getAccessToken();
    if (!token) return;
    try {
        await axios.delete(`http://localhost:8000/api/communities/${selectedCommunity.id}/delete/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        alert('Community deleted successfully');
        setCommunities(communities.filter(c => c.id !== selectedCommunity.id));
        setSelectedCommunity(null);
    } catch (error) {
        console.error('Error deleting community:', error);
        alert('Failed to delete community');
    }
  };

  const handleChatClick = (chat) => {
    setSelectedChat(chat);
  };

  if (!currentUser) {
    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
            <Typography variant="h6">Please log in to view communities.</Typography>
        </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#18191A', color: 'white', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <Box sx={{ display: 'flex', flex: 1, width: '100%', maxWidth: 1600, mx: 'auto' }}>
        <Paper 
          elevation={3} 
          sx={{ 
            width: { xs: '100%', md: '25%', lg: '18%' }, 
            backgroundColor: '#23242a', 
            p: 2,
            borderRadius: 0,
            overflow: 'auto',
            maxHeight: 'calc(100vh - 64px - 80px)',
          }}
        >
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar comunidades"
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'gray' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#35363a',
                  '&:hover fieldset': {
                    borderColor: 'primary.light',
                  },
                  '& fieldset': {
                    borderColor: '#35363a',
                  },
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                },
              }}
            />

            <Tooltip title="Criar comunidade">
              <IconButton
                color="primary"
                onClick={handleOpenCreateDialog}
                sx={{ 
                  backgroundColor: '#35363a',
                  '&:hover': { backgroundColor: '#4b4c4f' },
                  borderRadius: 2,
                  width: 40,
                  height: 40,
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: 'gray' }}>
                {searchQuery ? 'Resultados' : 'Comunidades'} ({filteredCommunities.length})
              </Typography>

              <List sx={{ p: 0 }}>
                {filteredCommunities.length === 0 ? (
                  <Typography variant="body2" color="gray" sx={{ textAlign: 'center', mt: 2 }}>
                    Nenhuma comunidade encontrada
                  </Typography>
                ) : (
                  filteredCommunities.map((community) => (
                    <React.Fragment key={community.id}>
                      <ListItem 
                        alignItems="flex-start" 
                        sx={{ 
                          p: 1, 
                          borderRadius: 2,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: '#35363a' },
                        }}
                        onClick={() => handleCommunityClick(community)}
                      >
                        <ListItemAvatar>
                          <Avatar 
                            src={community.icon_url} 
                            alt={community.name}
                            sx={{ width: 48, height: 48 }}
                          />
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontWeight: 600,
                                  fontSize: '0.95rem',
                                  color: 'primary.light',
                                }}
                              >
                                {community.name}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography
                              variant="body2"
                              color="gray"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: 1.2,
                              }}
                            >
                              {community.description}
                            </Typography>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" sx={{ backgroundColor: '#444' }}/>
                    </React.Fragment>
                  ))
                )}

                <Divider sx={{ my: 2, backgroundColor: '#555' }} />

                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: 'gray' }}>
                  Comunidades Públicas
                </Typography>

                {filteredPublicCommunities.length === 0 ? (
                  <Typography variant="body2" color="gray" sx={{ textAlign: 'center', mt: 2 }}>
                    Nenhuma comunidade pública encontrada
                  </Typography>
                ) : (
                  filteredPublicCommunities.map((community) => (
                    <React.Fragment key={community.id}>
                      <ListItem 
                        alignItems="flex-start" 
                        sx={{ 
                          p: 1, 
                          borderRadius: 2,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: '#35363a' },
                        }}
                        onClick={() => handleCommunityClick(community)}
                      >
                        <ListItemAvatar>
                          <Avatar 
                            src={community.icon_url} 
                            alt={community.name}
                            sx={{ width: 48, height: 48 }}
                          />
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontWeight: 600,
                                  fontSize: '0.95rem',
                                  color: 'white',
                                }}
                              >
                                {community.name}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography
                              variant="body2"
                              color="gray"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: 1.2,
                              }}
                            >
                              {community.description}
                            </Typography>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" sx={{ backgroundColor: '#444' }}/>
                    </React.Fragment>
                  ))
                )}
              </List>
            </>
          )}
        </Paper>

        {selectedCommunity && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
            <Typography variant="h5" sx={{ color: 'gray', textAlign: 'center', mb: 2 }}>
              {selectedCommunity.name}
            </Typography>
            <Box sx={{ display: 'flex', flex: 1 }}>
              <Paper 
                elevation={3} 
                sx={{ 
                  width: { xs: '100%', md: '25%', lg: '18%' }, 
                  backgroundColor: '#23242a', 
                  p: 2,
                  borderRadius: 0,
                  overflow: 'auto',
                  maxHeight: 'calc(100vh - 64px - 80px)',
                }}
              >
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: 'gray' }}>
                    Chats
                  </Typography>
                  <Tooltip title="Adicionar chat">
                    <IconButton
                      color="primary"
                      onClick={handleOpenChatDialog}
                      sx={{ 
                        backgroundColor: '#35363a',
                        '&:hover': { backgroundColor: '#4b4c4f' },
                        borderRadius: 2,
                        width: 40,
                        height: 40,
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

                <List sx={{ p: 0 }}>
                  {chats.length === 0 ? (
                    <Typography variant="body2" color="gray" sx={{ textAlign: 'center', mt: 2 }}>
                      Nenhum chat encontrado
                    </Typography>
                  ) : (
                    chats.map((chat) => (
                      <React.Fragment key={chat.id}>
                        <ListItem 
                          alignItems="flex-start" 
                          sx={{ 
                            p: 1, 
                            borderRadius: 2,
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: '#35363a' },
                          }}
                          onClick={() => handleChatClick(chat)}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    color: 'primary.light',
                                  }}
                                >
                                  {chat.name}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" sx={{ backgroundColor: '#444' }}/>
                      </React.Fragment>
                    ))
                  )}
                </List>
              </Paper>

              {selectedChat && (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#1e1f21', borderRadius: 2, p: 2 }}>
                  <ChatPage communityId={selectedCommunity.id} chatId={selectedChat.id} currentUser={currentUser} />
                </Box>
              )}
            </Box>

            <Button onClick={() => handleAddMember(prompt('Enter username to add:'))} disabled={!selectedCommunity || selectedCommunity.owner !== currentUser.id}>
                Add Member
            </Button>
            <Button onClick={handleDeleteCommunity} disabled={!selectedCommunity || selectedCommunity.owner !== currentUser.id}>
                Delete Community
            </Button>
          </Box>
        )}
      </Box>

      <Dialog
        open={createDialogOpen}
        onClose={() => !creatingCommunity && setCreateDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          style: {
            backgroundColor: '#2a2a2a',
            color: 'white',
            borderRadius: 8,
          }
        }}
      >
        <DialogTitle>Criar nova comunidade</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <Box
                sx={{
                  position: 'relative',
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  backgroundColor: '#3a3a3a',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}
              >
                {communityFormData.imagePreview ? (
                  <img 
                    src={communityFormData.imagePreview} 
                    alt="Preview" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <AddPhotoAlternateIcon sx={{ fontSize: 40, color: 'gray' }} />
                )}

                <input
                  accept="image/*"
                  type="file"
                  hidden
                  id="community-image-upload"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setCommunityFormData(prev => ({
                        ...prev,
                        image: file,
                        imagePreview: URL.createObjectURL(file)
                      }));
                    }
                  }}
                />
                <label htmlFor="community-image-upload">
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '30%',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'white' }}>
                      Alterar
                    </Typography>
                  </Box>
                </label>
              </Box>
            </Box>

            <TextField
              name="name"
              label="Nome da comunidade"
              value={communityFormData.name}
              onChange={handleFormChange}
              fullWidth
              error={Boolean(formErrors.name)}
              helperText={formErrors.name}
              InputLabelProps={{ style: { color: '#aaa' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#555' },
                  '&:hover fieldset': { borderColor: '#777' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                },
                '& .MuiInputBase-input': { color: 'white' },
              }}
            />

            <TextField
              name="description"
              label="Descrição"
              value={communityFormData.description}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={3}
              error={Boolean(formErrors.description)}
              helperText={
                formErrors.description || 
                `${communityFormData.description.length}/200 caracteres`
              }
              InputLabelProps={{ style: { color: '#aaa' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#555' },
                  '&:hover fieldset': { borderColor: '#777' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                },
                '& .MuiInputBase-input': { color: 'white' },
              }}
            />

            <FormControl component="fieldset">
              <FormLabel sx={{ color: '#aaa' }}>Privacidade</FormLabel>
              <RadioGroup
                row
                value={communityFormData.is_public ? 'public' : 'private'}
                onChange={(e) => setCommunityFormData(prev => ({
                  ...prev,
                  is_public: e.target.value === 'public'
                }))}
              >
                <FormControlLabel 
                  value="public" 
                  control={<Radio sx={{ color: '#aaa', '&.Mui-checked': { color: 'primary.main' } }} />} 
                  label="Pública" 
                  sx={{ color: 'white' }}
                />
                <FormControlLabel 
                  value="private" 
                  control={<Radio sx={{ color: '#aaa', '&.Mui-checked': { color: 'primary.main' } }} />} 
                  label="Privada" 
                  sx={{ color: 'white' }}
                />
              </RadioGroup>
              <Typography variant="caption" color="gray">
                {communityFormData.is_public 
                  ? 'Qualquer pessoa pode encontrar e participar da comunidade.'
                  : 'A comunidade não aparece nas buscas e precisa de convite.'}
              </Typography>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setCreateDialogOpen(false)} 
            sx={{ color: 'gray' }}
            disabled={creatingCommunity}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateCommunity} 
            variant="contained" 
            color="error"
            disabled={creatingCommunity}
          >
            {creatingCommunity ? <CircularProgress size={24} /> : 'Criar comunidade'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={chatDialogOpen}
        onClose={() => setChatDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          style: {
            backgroundColor: '#2a2a2a',
            color: 'white',
            borderRadius: 8,
          }
        }}
      >
        <DialogTitle>Criar novo chat</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              name="name"
              label="Nome do chat"
              value={newChatData.name}
              onChange={handleChatFormChange}
              fullWidth
              InputLabelProps={{ style: { color: '#aaa' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#555' },
                  '&:hover fieldset': { borderColor: '#777' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                },
                '& .MuiInputBase-input': { color: 'white' },
              }}
            />

            <FormControl fullWidth>
              <Select
                name="type"
                value={newChatData.type}
                onChange={handleChatFormChange}
                displayEmpty
                inputProps={{ 'aria-label': 'Tipo do chat' }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#555' },
                    '&:hover fieldset': { borderColor: '#777' },
                    '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                  },
                  '& .MuiInputBase-input': { color: 'white' },
                }}
              >
                <MenuItem value="" disabled>
                  Selecione o tipo do chat
                </MenuItem>
                <MenuItem value="text">Texto</MenuItem>
                <MenuItem value="calendar">Calendário</MenuItem>
                <MenuItem value="poll">Enquete</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setChatDialogOpen(false)} 
            sx={{ color: 'gray' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateChat} 
            variant="contained" 
            color="error"
          >
            Criar chat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

ComunidadesPage.propTypes = {
    currentUser: PropTypes.shape({
        id: PropTypes.string.isRequired,
        username: PropTypes.string.isRequired,
    }),
};

ComunidadesPage.defaultProps = {
    currentUser: null,
};

export default ComunidadesPage; 