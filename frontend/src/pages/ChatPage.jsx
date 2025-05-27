import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import CodeIcon from '@mui/icons-material/Code';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import LinkIcon from '@mui/icons-material/Link';

const ChatPage = ({ communityId, chatId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

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

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const insertMarkdown = (markdownSyntax, placeholder = '') => {
    const textField = document.querySelector('textarea');
    const start = textField.selectionStart;
    const end = textField.selectionEnd;
    const selectedText = newMessage.substring(start, end);
    const beforeText = newMessage.substring(0, start);
    const afterText = newMessage.substring(end);

    const textToInsert = selectedText || placeholder;
    const newText = beforeText + markdownSyntax.replace('text', textToInsert) + afterText;
    
    setNewMessage(newText);
    
    // Definir o foco e a posição do cursor após a atualização
    setTimeout(() => {
      textField.focus();
      const newCursorPos = start + markdownSyntax.indexOf('text') + (selectedText || placeholder).length;
      textField.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const markdownButtons = [
    { tooltip: 'Negrito', icon: <FormatBoldIcon />, syntax: '**text**', placeholder: 'texto em negrito' },
    { tooltip: 'Itálico', icon: <FormatItalicIcon />, syntax: '_text_', placeholder: 'texto em itálico' },
    { tooltip: 'Código', icon: <CodeIcon />, syntax: '`text`', placeholder: 'código' },
    { tooltip: 'Lista com marcadores', icon: <FormatListBulletedIcon />, syntax: '\n- text', placeholder: 'item da lista' },
    { tooltip: 'Lista numerada', icon: <FormatListNumberedIcon />, syntax: '\n1. text', placeholder: 'item da lista' },
    { tooltip: 'Link', icon: <LinkIcon />, syntax: '[text](url)', placeholder: 'descrição do link' },
  ];

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Chat</Typography>
      <List sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
        {messages.map((message, index) => (
          <React.Fragment key={index}>
            <ListItem alignItems="flex-start" sx={{ py: 1 }}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {message.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(message.sent_at).toLocaleTimeString()}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Paper 
                    sx={{ 
                      mt: 0.5, 
                      p: 1,
                      backgroundColor: 'background.paper',
                      '& p': { m: 0 }, // Remove margens dos parágrafos no markdown
                    }}
                  >
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Customiza os componentes do markdown para usar os estilos do MUI
                        p: ({node, ...props}) => <Typography variant="body2" {...props} />,
                        a: ({node, ...props}) => <Typography variant="body2" component="a" color="primary" {...props} />,
                        code: ({node, inline, ...props}) => (
                          inline 
                            ? <Typography variant="body2" component="code" sx={{ backgroundColor: 'grey.100', p: 0.5, borderRadius: 1 }} {...props} />
                            : <Paper sx={{ p: 1, backgroundColor: 'grey.100', overflowX: 'auto' }}><Typography variant="body2" component="pre" {...props} /></Paper>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </Paper>
                }
              />
            </ListItem>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>
      <Box sx={{ mt: 2 }}>
        <Paper sx={{ mb: 1, p: 0.5 }}>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {markdownButtons.map((button, index) => (
              <Tooltip key={index} title={button.tooltip}>
                <IconButton 
                  size="small"
                  onClick={() => insertMarkdown(button.syntax, button.placeholder)}
                >
                  {button.icon}
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        </Paper>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            multiline
            maxRows={4}
            size="small"
          />
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSendMessage}
            sx={{ minWidth: 100 }}
          >
            Enviar
          </Button>
        </Box>
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