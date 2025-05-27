import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material';

const ChatPage = ({ communityId, chatId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8000/api/communities/${communityId}/chats/${chatId}/messages/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages.');
      setOpenSnackbar(true);
    }
  };

  useEffect(() => {
    fetchMessages(); // Initial fetch
    const intervalId = setInterval(fetchMessages, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [communityId, chatId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8000/api/communities/${communityId}/chats/${chatId}/messages/`, {
        content: newMessage
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message.');
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Chat</Typography>
      <List sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
        {messages.map((message, index) => (
          <React.Fragment key={index}>
            <ListItem alignItems="flex-start">
              <ListItemText
                primary={
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {message.username}
                  </Typography>
                }
                secondary={
                  <>
                    <Typography variant="body2" color="textSecondary">
                      {message.content}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(message.sent_at).toLocaleString()}
                    </Typography>
                  </>
                }
              />
            </ListItem>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>
      <Box sx={{ mt: 2, display: 'flex' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <Button variant="contained" color="primary" onClick={handleSendMessage} sx={{ ml: 2 }}>
          Send
        </Button>
      </Box>
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatPage; 