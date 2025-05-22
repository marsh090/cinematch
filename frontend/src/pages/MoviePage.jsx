import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, Chip, CircularProgress, Avatar, Snackbar, Alert, IconButton, Stack, TextField, Tooltip } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CloseIcon from '@mui/icons-material/Close';
import Rating from '@mui/material/Rating';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

function MoviePage() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [actions, setActions] = useState({ like: false, dislike: false, favoritado: false, assistir_mais_tarde: false, avaliacao: 0 });
  const [loading, setLoading] = useState(true);
  const [forum, setForum] = useState([]);
  const [forumLoading, setForumLoading] = useState(true);
  const [forumPage, setForumPage] = useState(1);
  const [forumFiltro, setForumFiltro] = useState('recentes');
  const [forumText, setForumText] = useState('');
  const [forumParent, setForumParent] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const token = localStorage.getItem('token');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyOpen, setReplyOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [userRating, setUserRating] = useState(actions.avaliacao || 0);

  // Fetch movie info
  const fetchMovie = useCallback(() => {
    setLoading(true);
    fetch(`http://localhost:8000/api/movies/${id}/`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        return res.json();
      })
      .then(data => {
        if (data) setMovie(data);
      })
      .catch(error => {
        console.error('Error fetching movie:', error);
        setSnackbar({ open: true, message: 'Erro ao carregar filme', severity: 'error' });
      })
      .finally(() => setLoading(false));
  }, [id, token]);

  // Fetch user actions
  const fetchActions = useCallback(() => {
    fetch(`http://localhost:8000/api/movies/${id}/user_action/`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        return res.json();
      })
      .then(data => {
        if (data) setActions(data);
      })
      .catch(error => {
        console.error('Error fetching actions:', error);
        setSnackbar({ open: true, message: 'Erro ao carregar ações', severity: 'error' });
      });
  }, [id, token]);

  useEffect(() => {
    fetchMovie();
    fetchActions();
  }, [fetchMovie, fetchActions]);

  // Fetch forum
  const fetchForum = useCallback(() => {
    setForumLoading(true);
    fetch(`http://localhost:8000/api/movies/${id}/forum/?page=${forumPage}&filtro=${forumFiltro}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        return res.json();
      })
      .then(data => {
        if (data) {
          setForum(data.results || []);
        }
      })
      .catch(error => {
        console.error('Error fetching forum:', error);
        setSnackbar({ open: true, message: 'Erro ao carregar fórum', severity: 'error' });
      })
      .finally(() => setForumLoading(false));
  }, [id, token, forumPage, forumFiltro]);

  useEffect(() => {
    fetchForum();
  }, [fetchForum]);

  // Handle actions
  const handleAction = (field) => {
    let body = {};
    if (field === 'like') {
      body = { like: actions.like === 1 ? null : 1 };
    } else if (field === 'dislike') {
      body = { like: actions.like === 0 ? null : 0 };
    } else {
      body = { [field]: !actions[field] };
    }
    fetch(`http://localhost:8000/api/movies/${id}/update_action/`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        return res.json();
      })
      .then(data => {
        if (data) {
          setActions(data);
          fetchMovie(); // Atualiza a nota média do filme
        }
      })
      .catch(error => {
        console.error('Error handling action:', error);
        setSnackbar({ open: true, message: 'Erro ao processar ação', severity: 'error' });
      });
  };

  // Forum: enviar comentário
  const handleForumSubmit = (e) => {
    e.preventDefault();
    if (!forumText.trim()) return;
    fetch(`http://localhost:8000/api/movies/${id}/forum/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ texto: forumText, parent: forumParent }),
    })
      .then(res => res.json())
      .then(() => {
        setForumText('');
        setForumParent(null);
        fetchForum();
      });
  };

  // Forum: enviar resposta
  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !replyTo) return;
    fetch(`http://localhost:8000/api/movies/${id}/forum/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ texto: replyText, parent: replyTo }),
    })
      .then(res => res.json())
      .then(() => {
        setReplyText('');
        setReplyTo(null);
        setReplyOpen(false);
        fetchForum();
      });
  };

  // Forum: like comentário
  const handleForumLike = (commentId, cb) => {
    fetch(`http://localhost:8000/api/forum/${commentId}/like/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        if (cb) cb();
        else fetchForum();
      });
  };

  // Forum: reportar comentário
  const handleForumReport = (commentId) => {
    fetch(`http://localhost:8000/api/forum/${commentId}/report/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setSnackbar({ open: true, message: data.detail, severity: data.detail === 'Não implementado' ? 'info' : 'success' }));
  };

  // Atualizar userRating quando actions mudar
  useEffect(() => {
    setUserRating(actions.avaliacao || 0);
  }, [actions.avaliacao]);

  // Avaliar filme
  const handleRateSubmit = () => {
    fetch(`http://localhost:8000/api/movies/${id}/rate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nota: userRating }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setSnackbar({ open: true, message: data.error, severity: 'error' });
          return;
        }
        setRateOpen(false);
        fetchMovie();
        fetchActions();
        setSnackbar({ open: true, message: 'Avaliação enviada com sucesso!', severity: 'success' });
      })
      .catch(error => {
        console.error('Error rating movie:', error);
        setSnackbar({ open: true, message: 'Erro ao enviar avaliação', severity: 'error' });
      });
  };

  if (loading || !movie) {
    return <Box sx={{ minHeight: '100vh', background: '#161718' }}><Header /><Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><CircularProgress /></Box><Footer /></Box>;
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#161718', display: 'flex', flexDirection: 'column' }}>
      <Header />
      {/* Info do filme */}
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', p: 4, overflow: 'hidden' }}>
        <Box sx={{
          position: 'absolute',
          inset: 0,
          background: `url(${movie.backdrop_path}) center center/cover no-repeat`,
          filter: 'blur(12px) brightness(0.4)',
          zIndex: 1,
        }} />
        <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%' }}>
          <Avatar src={movie.poster_path} alt={movie.titulo} variant="rounded" sx={{ width: 360, height: 540, mr: 4, boxShadow: 3, border: '4px solid #2d2e2f' }} />
          <Box sx={{ color: 'white', maxWidth: 800 }}>
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 1 }}>{movie.titulo}</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{movie.sinopse}</Typography>
            {/* Diretores e elenco */}
            {movie.diretor && (
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                <b>Diretor:</b> {Array.isArray(movie.diretor) ? movie.diretor.join(', ') : movie.diretor}
              </Typography>
            )}
            {movie.elenco_principal && movie.elenco_principal.length > 0 && (
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                <b>Elenco principal:</b> {movie.elenco_principal.join(', ')}
              </Typography>
            )}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Tooltip title={actions.assistido ? 'Avaliar filme' : 'Marque como assistido para avaliar'}>
                <span>
                  <Chip
                    label={`Nota: ${movie.avaliacao_media?.toFixed(1)}`}
                    color="primary"
                    onClick={actions.assistido ? () => setRateOpen(true) : undefined}
                    sx={{ cursor: actions.assistido ? 'pointer' : 'not-allowed', fontWeight: 700, opacity: actions.assistido ? 1 : 0.5 }}
                  />
                </span>
              </Tooltip>
              <Chip label={movie.data_lancamento} />
              <Chip label={movie.generos?.join(', ')} />
              <Chip label={`Duração: ${movie.duracao} min`} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <IconButton onClick={() => handleAction('like')} sx={{ bgcolor: 'black', color: actions.like === 1 ? 'primary.main' : 'white', '&:hover': { bgcolor: 'black', color: 'primary.main' } }}>
                {actions.like === 1 ? <ThumbUpIcon /> : <ThumbUpOffAltIcon />}
              </IconButton>
              <IconButton onClick={() => handleAction('dislike')} sx={{ bgcolor: 'black', color: actions.like === 0 ? 'error.main' : 'white', '&:hover': { bgcolor: 'black', color: 'error.main' } }}>
                {actions.like === 0 ? <ThumbDownIcon /> : <ThumbDownOffAltIcon />}
              </IconButton>
              <IconButton onClick={() => handleAction('favoritado')} sx={{ bgcolor: 'black', color: actions.favoritado ? 'secondary.main' : 'white', '&:hover': { bgcolor: 'black', color: 'secondary.main' } }}>
                {actions.favoritado ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
              <IconButton onClick={() => handleAction('assistir_mais_tarde')} sx={{ bgcolor: 'black', color: actions.assistir_mais_tarde ? 'info.main' : 'white', '&:hover': { bgcolor: 'black', color: 'info.main' } }}>
                {actions.assistir_mais_tarde ? <WatchLaterIcon /> : <WatchLaterOutlinedIcon />}
              </IconButton>
              <Tooltip title={actions.assistido ? 'Remover dos assistidos' : 'Marcar como assistido'}>
                <IconButton onClick={() => handleAction('assistido')} sx={{ bgcolor: 'black', color: actions.assistido ? 'success.main' : 'white', '&:hover': { bgcolor: 'black', color: 'success.main' } }}>
                  {actions.assistido ? <CheckCircleIcon /> : <CheckCircleOutlineIcon />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </Box>
      </Box>
      {/* Fórum */}
      <Box sx={{ flex: 1, background: '#181c24', p: 4 }}>
        <Typography variant="h3" sx={{ mb: 2 }}>Fórum do Filme</Typography>
        <Box component="form" onSubmit={handleForumSubmit} sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            placeholder={actions.assistido ? "Escreva um comentário..." : "Marque como assistido para comentar"}
            value={forumText}
            onChange={e => setForumText(e.target.value)}
            size="small"
            sx={{ background: '#23242a', borderRadius: 2 }}
            disabled={!actions.assistido}
          />
          <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 700 }} disabled={!actions.assistido}>Enviar</Button>
        </Box>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button variant={forumFiltro === 'recentes' ? 'contained' : 'outlined'} onClick={() => { setForumFiltro('recentes'); setForumPage(1); }}>Mais recentes</Button>
          <Button variant={forumFiltro === 'antigos' ? 'contained' : 'outlined'} onClick={() => { setForumFiltro('antigos'); setForumPage(1); }}>Mais antigos</Button>
          <Button variant={forumFiltro === 'bem_avaliados' ? 'contained' : 'outlined'} onClick={() => { setForumFiltro('bem_avaliados'); setForumPage(1); }}>Mais bem avaliados</Button>
        </Stack>
        {forumLoading ? <CircularProgress /> : (
          forum.length === 0 ? <Typography>Nenhum comentário ainda.</Typography> : (
            forum.map(comment => (
              <ForumCommentItem
                key={comment.id}
                comment={comment}
                onLike={handleForumLike}
                onReport={handleForumReport}
                onReply={id => {
                  if (actions.assistido) {
                    setReplyTo(id);
                    setReplyOpen(true);
                  }
                }}
                canReply={actions.assistido}
              />
            ))
          )
        )}
      </Box>
      {/* Popup de resposta */}
      <Dialog open={replyOpen} onClose={() => { setReplyOpen(false); setReplyTo(null); }}>
        <DialogTitle>
          Responder comentário
          <IconButton aria-label="close" onClick={() => { setReplyOpen(false); setReplyTo(null); }} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Sua resposta"
            type="text"
            fullWidth
            variant="outlined"
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setReplyOpen(false); setReplyTo(null); }}>Cancelar</Button>
          <Button onClick={handleReplySubmit} variant="contained">Enviar</Button>
        </DialogActions>
      </Dialog>
      {/* Dialog de avaliação */}
      <Dialog open={rateOpen} onClose={() => setRateOpen(false)}>
        <DialogTitle>
          Avalie o filme
          <IconButton aria-label="close" onClick={() => setRateOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
            <Rating
              name="user-rating"
              value={userRating / 2}
              precision={0.5}
              max={5}
              onChange={(_, newValue) => actions.assistido && setUserRating((newValue || 0) * 2)}
              sx={{ fontSize: 48, opacity: actions.assistido ? 1 : 0.5 }}
              disabled={!actions.assistido}
            />
            <Typography sx={{ mt: 2 }}>Sua nota: {userRating.toFixed(1)} / 10</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRateOpen(false)}>Cancelar</Button>
          <Button onClick={handleRateSubmit} variant="contained" disabled={!actions.assistido}>Salvar</Button>
        </DialogActions>
      </Dialog>
      <Footer />
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

function ForumCommentItem({ comment, onLike, onReport, onReply, canReply }) {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [repliesPage, setRepliesPage] = useState(1);
  const [repliesCount, setRepliesCount] = useState(0);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const token = localStorage.getItem('token');

  const fetchReplies = useCallback(() => {
    setLoadingReplies(true);
    fetch(`http://localhost:8000/api/movies/${comment.filme}/forum/?parent=${comment.id}&page=${repliesPage}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setReplies(data.results || []);
        setRepliesCount(data.count || 0);
      })
      .finally(() => setLoadingReplies(false));
  }, [comment.filme, comment.id, repliesPage, token]);

  useEffect(() => {
    if (showReplies) {
      fetchReplies();
    }
  }, [showReplies, fetchReplies]);

  const handleLike = () => onLike(comment.id, fetchReplies);

  return (
    <Box sx={{ mb: 2, p: 2, background: '#23242a', borderRadius: 2 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Avatar sx={{ width: 32, height: 32 }}>{comment.user.name?.[0] || comment.user.username?.[0]}</Avatar>
        <Typography sx={{ fontWeight: 700 }}>{comment.user.name || comment.user.username}</Typography>
        <Typography variant="caption" sx={{ color: 'gray' }}>{new Date(comment.created_at).toLocaleString()}</Typography>
      </Stack>
      <Typography sx={{ mt: 1, mb: 1 }}>{comment.texto}</Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <IconButton size="small" onClick={handleLike}><ThumbUpIcon fontSize="small" /></IconButton>
        <Typography variant="caption">{comment.likes_count}</Typography>
        <Button size="small" color="error" onClick={() => onReport(comment.id)}>Reportar</Button>
        <Tooltip title={canReply ? 'Responder' : 'Marque como assistido para responder'}>
          <span>
            <Button size="small" onClick={() => canReply && onReply(comment.id)} disabled={!canReply}>Responder</Button>
          </span>
        </Tooltip>
        {comment.replies && comment.replies.length > 0 && (
          <Button size="small" onClick={() => setShowReplies(v => !v)}>
            {showReplies ? 'Ocultar respostas' : `Ver respostas (${comment.replies.length})`}
          </Button>
        )}
      </Stack>
      {/* Respostas diretas paginadas */}
      {showReplies && (
        <Box sx={{ ml: 4, mt: 2 }}>
          {loadingReplies ? <CircularProgress size={20} /> : (
            replies.map(reply => (
              <ForumCommentItem key={reply.id} comment={reply} onLike={onLike} onReport={onReport} onReply={onReply} canReply={canReply} />
            ))
          )}
          {repliesCount > replies.length && (
            <Button size="small" onClick={() => setRepliesPage(p => p + 1)}>Carregar mais respostas</Button>
          )}
        </Box>
      )}
    </Box>
  );
}

export default MoviePage; 