import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import mockCommunity1 from '../mockdata/community_1.json';

const CommunityBase = ({ community }) => {
  const [chats, setChats] = useState([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [chatFormData, setChatFormData] = useState({
    name: '',
    type: 'text'
  });
  const [selectedChat, setSelectedChat] = useState(null);
  const [summary, setSummary] = useState('');

  useEffect(() => {
    // Carregar dados dos chats da comunidade
    if (community.id === 1) {
      setChats(mockCommunity1.chats);
    }
  }, [community]);

  useEffect(() => {
    // Fetch summary from the backend
    const fetchSummary = async () => {
      try {
        const response = await fetch(`/api/movies/${community.id}/summarize-comments`);
        const data = await response.json();
        setSummary(data.resumo);
      } catch (error) {
        console.error('Error fetching summary:', error);
      }
    };
    fetchSummary();
  }, [community.id]);

  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setChatFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateChat = () => {
    // Simular criação de chat
    setChats(prev => [...prev, { ...chatFormData, id: Date.now() }]);
    setCreateDialogOpen(false);
    setChatFormData({ name: '', type: 'text' });
  };

  const handleChatClick = (chat) => {
    setSelectedChat(chat);
  };

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <Box sx={{ width: '25%', borderRight: '1px solid rgba(255, 255, 255, 0.12)', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Chats</Typography>
          {community.owner.username === 'zanon' && (
            <IconButton
              color="primary"
              onClick={handleOpenCreateDialog}
            >
              <AddIcon />
            </IconButton>
          )}
        </Box>
        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
          {chats.map(chat => (
            <React.Fragment key={chat.id}>
              <ListItem button onClick={() => handleChatClick(chat)}>
                <ListItemText primary={chat.name} secondary={chat.type} />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Box>
      <Box sx={{ flexGrow: 1, p: 2 }}>
        {selectedChat ? (
          <Typography variant="h6">Conteúdo do Chat: {selectedChat.name}</Typography>
        ) : (
          <Typography variant="body1" color="textSecondary">Selecione um chat para ver o conteúdo.</Typography>
        )}
      </Box>

      <Box sx={{ p: 2, mb: 2, border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 1 }}>
        <Typography variant="h6">Resumo dos Comentários</Typography>
        <Typography variant="body1" color="textSecondary">{summary}</Typography>
      </Box>

      <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog} fullWidth maxWidth="sm">
        <DialogTitle>Criar Novo Chat</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Tipo de Chat</InputLabel>
            <Select
              name="type"
              value={chatFormData.type}
              onChange={handleFormChange}
            >
              <MenuItem value="text">Mensagem</MenuItem>
              <MenuItem value="poll">Enquete</MenuItem>
              <MenuItem value="calendar">Calendário</MenuItem>
            </Select>
          </FormControl>
          <TextField
            name="name"
            label="Nome do Chat"
            value={chatFormData.name}
            onChange={handleFormChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleCreateChat} color="primary" variant="contained">
            Criar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommunityBase; 