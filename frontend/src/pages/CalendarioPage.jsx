import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Paper,
  Stack,
  CircularProgress,
  Modal,
  TextField,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { styled } from '@mui/material/styles';

const API_URL = 'http://localhost:8000/api';

const getEventsForDay = (date, events) => {
  return events.filter(event => {
    const eventDate = new Date(event.event_datetime);
    return (
      eventDate.getFullYear() === date.getFullYear() &&
      eventDate.getMonth() === date.getMonth() &&
      eventDate.getDate() === date.getDate()
    );
  });
};

// Estilo customizado para o calendário
const CalendarWrapper = styled('div')(({ theme }) => ({
  '.react-calendar': {
    width: '100%',
    background: '#23242a',
    borderRadius: 16,
    border: 'none',
    color: '#fff',
    fontFamily: 'inherit',
    boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)',
    padding: 8,
  },
  '.react-calendar__navigation': {
    background: 'none',
    marginBottom: 12,
    borderRadius: 8,
  },
  '.react-calendar__navigation button': {
    color: '#fff',
    minWidth: 44,
    fontWeight: 700,
    fontSize: 20,
    background: 'none',
    border: 'none',
    borderRadius: 8,
    transition: 'background 0.2s',
    '&:hover': {
      background: '#444',
    },
  },
  '.react-calendar__month-view__weekdays': {
    textAlign: 'center',
    textTransform: 'capitalize',
    color: '#99bbff',
    fontWeight: 700,
    fontSize: 16,
    background: 'none',
  },
  '.react-calendar__tile': {
    background: 'none',
    color: '#fff',
    borderRadius: 8,
    fontSize: 18,
    fontWeight: 500,
    transition: 'background 0.2s, color 0.2s',
    height: 56,
    '&:hover': {
      background: '#23242a',
      color: '#4b80ca',
    },
  },
  '.react-calendar__tile--active': {
    background: '#4b80ca',
    color: '#fff',
    borderRadius: 8,
  },
  '.react-calendar__tile--now': {
    background: '#23242a',
    color: '#ff4747',
    border: '1.5px solid #ff4747',
    borderRadius: 8,
  },
  '.react-calendar__tile--hasActive': {
    background: '#4b80ca',
    color: '#fff',
    borderRadius: 8,
  },
  '.react-calendar__month-view__days__day--neighboringMonth': {
    color: '#888',
    opacity: 0.5,
  },
  '.react-calendar__month-view__weekdays__weekday': {
    padding: 8,
  },
}));

// Estilo para o modal
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 500 },
  maxHeight: '90vh',
  overflow: 'auto',
  bgcolor: '#2a2a2a',
  border: '1px solid #333',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  color: 'white',
};

function CalendarioPage() {
  const [value, setValue] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    image: '',
    time: '12:00' // Horário padrão: meio-dia
  });
  const [submitting, setSubmitting] = useState(false);
  
  const username = localStorage.getItem('username') || '';
  const token = localStorage.getItem('token');

  // Função para buscar eventos da API
  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Obtém o ano e mês atual para filtrar eventos
      const year = value.getFullYear();
      const month = value.getMonth() + 1; // JavaScript meses são 0-11
      const monthString = month < 10 ? `0${month}` : month;
      
      const response = await fetch(`${API_URL}/events/?month=${year}-${monthString}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        console.error('Erro ao buscar eventos');
        setEvents([]);
      }
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchEvents();
    } else {
      setLoading(false);
    }
  }, [value, token]);

  // Eventos do usuário logado
  const userEvents = events.filter(e => 
    (e.participants && e.participants.some(p => p.username === username)) || 
    (e.owner && e.owner.username === username)
  );

  // Customização de tile para mostrar badge de evento
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayEvents = getEventsForDay(date, events);
      if (dayEvents.length > 0) {
        return (
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <Box
              sx={{
                position: 'absolute',
                top: 4,
                left: 6,
                width: 10,
                height: 10,
                bgcolor: '#ff4747',
                borderRadius: '50%',
                zIndex: 2,
                boxShadow: '0 0 2px #0008',
              }}
            />
          </Box>
        );
      }
    }
    return null;
  };

  // Handler para clique nos dias do calendário
  const handleDayClick = (value) => {
    setSelectedDate(value);
    setFormData({
      title: '',
      description: '',
      location: '',
      image: '',
      time: '12:00' // Horário padrão: meio-dia
    });
    setOpenModal(true);
  };

  // Handler para mudança nos campos do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler para criar evento
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      setSnackbar({
        open: true,
        message: 'O título do evento é obrigatório',
        severity: 'error'
      });
      return;
    }

    setSubmitting(true);
    
    try {
      // Combinando data e hora
      const [hours, minutes] = formData.time.split(':').map(Number);
      const combinedDateTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        hours,
        minutes
      );
      
      const eventData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        image: formData.image,
        event_datetime: combinedDateTime.toISOString(),
      };
      
      const response = await fetch(`${API_URL}/events/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });
      
      if (response.ok) {
        const newEvent = await response.json();
        setSnackbar({
          open: true,
          message: 'Evento criado com sucesso!',
          severity: 'success'
        });
        setOpenModal(false);
        fetchEvents();
      } else {
        const error = await response.json();
        setSnackbar({
          open: true,
          message: `Erro ao criar evento: ${error.detail || 'Tente novamente mais tarde'}`,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao criar evento. Tente novamente mais tarde.',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#18191A', color: 'white', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Grid container spacing={2} sx={{ flex: 1, mt: 0, maxWidth: 1600, mx: 'auto', width: '100%' }}>
        {/* Espaço coluna 1 */}
        <Grid item xs={0.5} md={1} lg={1.5} />
        {/* Calendário colunas 2-6 */}
        <Grid item xs={12} md={7} lg={7} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', mt: 6 }}>
          <Paper elevation={3} sx={{ p: 4, background: '#444', borderRadius: 4, width: '100%', maxWidth: 700, minHeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h4" sx={{ mb: 2, color: 'white', fontWeight: 700, textTransform: 'capitalize', alignSelf: 'flex-start' }}>
              Calendario de Eventos
            </Typography>
            <CalendarWrapper style={{ width: '100%' }}>
              <Calendar
                onChange={setValue}
                value={value}
                tileContent={tileContent}
                calendarType="iso8601"
                locale="pt-BR"
                next2Label={null}
                prev2Label={null}
                minDetail="month"
                maxDetail="month"
                onClickDay={handleDayClick}
              />
            </CalendarWrapper>
          </Paper>
        </Grid>
        {/* Lista de eventos do usuário na coluna 7 */}
        <Grid item xs={12} md={3} lg={3} sx={{ mt: 6 }}>
          <Paper elevation={3} sx={{ p: 3, background: '#23242a', borderRadius: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'white', fontWeight: 700 }}>
              Próximos Eventos
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Stack spacing={2}>
                {userEvents.length === 0 ? (
                  <Typography color="gray">Nenhum evento encontrado.</Typography>
                ) : (
                  userEvents
                    .sort((a, b) => new Date(a.event_datetime) - new Date(b.event_datetime))
                    .map(event => (
                      <Card key={event.id} sx={{ display: 'flex', background: '#444', color: 'white', borderRadius: 3, padding: '10px' }}>
                        <CardContent sx={{ flex: 1, p: 1 }}>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'white' }}>
                            {event.title}
                          </Typography>
                          <Typography variant="body2" color="gray">
                            {new Date(event.event_datetime).toLocaleDateString('pt-BR')} às {new Date(event.event_datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                          <Typography variant="body2" color="gray">
                            {event.location}
                          </Typography>
                          <Typography variant="caption" color="gray">
                            Organizado por {event.owner && event.owner.username}
                          </Typography>
                          {event.owner && event.owner.username !== username && (
                            <Button variant="contained" color="error" size="small" sx={{ mt: 1, borderRadius: 2, fontWeight: 700 }}>
                              {event.is_participating ? 'Sair' : 'Participar'}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))
                )}
              </Stack>
            )}
          </Paper>
        </Grid>
        {/* Espaço coluna 8 */}
        <Grid item xs={0.5} md={1} lg={0.5} />
      </Grid>
      <Footer />

      {/* Modal para Criar Evento */}
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        aria-labelledby="create-event-modal"
      >
        <Box sx={modalStyle}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2" fontWeight={700}>
              Criar Evento
            </Typography>
            <IconButton onClick={() => setOpenModal(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {selectedDate && (
            <Typography variant="body1" sx={{ mb: 3 }}>
              Data selecionada: {selectedDate.toLocaleDateString('pt-BR', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}
            </Typography>
          )}
          
          <form onSubmit={handleCreateEvent}>
            <Stack spacing={3}>
              <TextField
                label="Título do Evento *"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                fullWidth
                required
                InputLabelProps={{ style: { color: '#99bbff' } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#99bbff',
                    },
                  },
                }}
              />
              
              <TextField
                label="Descrição"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
                InputLabelProps={{ style: { color: '#99bbff' } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#99bbff',
                    },
                  },
                }}
              />
              
              <TextField
                label="Horário"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleInputChange}
                fullWidth
                InputLabelProps={{ 
                  style: { color: '#99bbff' },
                  shrink: true 
                }}
                inputProps={{
                  step: 300, // 5 min
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#99bbff',
                    },
                  },
                }}
              />
              
              <TextField
                label="Local"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                fullWidth
                InputLabelProps={{ style: { color: '#99bbff' } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#99bbff',
                    },
                  },
                }}
              />
              
              <TextField
                label="URL da Imagem (opcional)"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                fullWidth
                InputLabelProps={{ style: { color: '#99bbff' } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#99bbff',
                    },
                  },
                }}
                placeholder="https://exemplo.com/imagem.jpg"
              />
              
              <Button
                type="submit"
                variant="contained"
                color="error"
                size="large"
                disabled={submitting}
                sx={{ mt: 2, borderRadius: 2, fontWeight: 700 }}
              >
                {submitting ? <CircularProgress size={24} color="inherit" /> : 'Criar Evento'}
              </Button>
            </Stack>
          </form>
        </Box>
      </Modal>

      {/* Snackbar para mensagens */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({...snackbar, open: false})}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({...snackbar, open: false})}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default CalendarioPage; 