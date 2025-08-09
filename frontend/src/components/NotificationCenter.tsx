import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Fab,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import { 
  Email, 
  Sms, 
  CheckCircle, 
  Error, 
  Info, 
  Warning,
  Visibility,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import NotificationSettings from './NotificationSettings';
import axios from 'axios';

interface Notification {
  id: string;
  userId: string;
  type: 'email' | 'sms';
  title: string;
  message: string;
  status: 'sent' | 'failed';
  createdAt: string;
  category: 'transaction' | 'fund' | 'system' | 'promotion';
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info'
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Obtener notificaciones del usuario desde el backend DynamoDB
      const response = await axios.get('http://localhost:3000/api/user/user123/notifications');
      
      if (response.data.success) {
        // Mapear la estructura de datos del backend a la esperada por el frontend
        const mappedNotifications = (response.data.notifications || []).map((notification: any) => ({
          id: notification.notificationId || notification.id || 'unknown',
          userId: notification.userId || 'user123',
          type: notification.type || 'email',
          title: notification.title || 'Sin título',
          message: notification.message || 'Sin mensaje',
          status: notification.status || 'sent',
          createdAt: notification.createdAt || notification.lastUpdated || new Date().toISOString(),
          category: notification.category || 'system'
        }));
        
        setNotifications(mappedNotifications);
      } else {
        console.error('API Error:', response.data.error);
        setNotifications([]);
      }
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar las notificaciones',
        severity: 'error'
      });
      
      // En caso de error, mostrar array vacío en lugar de mock data
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) {
        return 'Fecha no disponible';
      }
      
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error en fecha';
    }
  };

  const getNotificationIcon = (type: string, status: string) => {
    if (status === 'failed') return <Error color="error" />;
    return type === 'email' ? <Email color="primary" /> : <Sms color="secondary" />;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transaction': return <CheckCircle color="success" />;
      case 'fund': return <Info color="info" />;
      case 'system': return <Warning color="warning" />;
      case 'promotion': return <Info color="primary" />;
      default: return <Info />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'transaction': return 'success';
      case 'fund': return 'info';
      case 'system': return 'warning';
      case 'promotion': return 'primary';
      default: return 'default';
    }
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>

      
      <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} sx={{ mb: 3 }}>
        <Tab 
          label="Notificaciones" 
          icon={<Email />} 
        />
        <Tab 
          label="Configuración" 
          icon={<SettingsIcon />} 
        />
      </Tabs>

      {currentTab === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Mis Notificaciones
            </Typography>
            <Box>
              <Tooltip title="Actualizar notificaciones">
                <IconButton onClick={fetchNotifications} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
             
            </Box>
          </Box>
          
          {(!notifications || notifications.length === 0) ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No hay notificaciones
              </Typography>
            </Paper>
          ) : (
            <Paper>
              <List>
                {notifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ListItem
                      sx={{
                        '&:hover': { backgroundColor: 'action.selected' }
                      }}
                    >
                      <ListItemIcon>
                        {getNotificationIcon(notification.type, notification.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">
                              {notification.title || 'Sin título'}
                            </Typography>
                            <Chip
                              label={notification.category}
                              size="small"
                              color={getCategoryColor(notification.category) as any}
                              variant="outlined"
                            />
                            {notification.status === 'failed' && (
                              <Chip
                                label="Falló"
                                size="small"
                                color="error"
                                variant="filled"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {(notification.message && notification.message.length > 100) 
                                ? `${notification.message.substring(0, 100)}...` 
                                : (notification.message || 'Sin mensaje')
                              }
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(notification.createdAt)} • 
                              {notification.type === 'email' ? ' Email' : ' SMS'}
                            </Typography>
                          </Box>
                        }
                      />
                      <Box display="flex" alignItems="center" gap={1}>
                        <IconButton
                          size="small"
                          onClick={() => setSelectedNotification(notification)}
                          title="Ver detalles"
                        >
                          <Visibility />
                        </IconButton>
                      </Box>
                    </ListItem>
                    {index < (notifications?.length || 0) - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      )}

      {currentTab === 1 && (
        <NotificationSettings />
      )}

      {/* Notification Details Dialog */}
      <Dialog 
        open={selectedNotification !== null} 
        onClose={() => setSelectedNotification(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedNotification?.title}
        </DialogTitle>
        <DialogContent>
          {selectedNotification && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1" gutterBottom>
                {selectedNotification.message}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Fecha:</strong> {formatDate(selectedNotification.createdAt)}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Tipo:</strong> {selectedNotification.type.toUpperCase()}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Categoría:</strong> {
                  selectedNotification.category === 'transaction' ? 'Transacción' :
                  selectedNotification.category === 'fund' ? 'Fondo' :
                  selectedNotification.category === 'system' ? 'Sistema' : 'Promoción'
                }
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Estado:</strong> {selectedNotification.status === 'sent' ? 'Enviado' : 'Fallido'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedNotification(null)} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationCenter;
