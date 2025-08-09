import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Divider,
} from '@mui/material';
import { Email, Sms, Notifications, Person, Phone } from '@mui/icons-material';
import axios from 'axios';

interface NotificationSettings {
  userId: string;
  preferredMethod: 'email' | 'sms';
  emailNotifications: boolean;
  smsNotifications: boolean;
  email: string;
  phoneNumber: string;
}

const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    userId: 'user123',
    preferredMethod: 'email',
    emailNotifications: true,
    smsNotifications: false,
    email: 'camachoeva.07@gmail.com',
    phoneNumber: '+57 300 123 4567',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    phone: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  // Función para validar email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Función para validar número de teléfono
  const validatePhoneNumber = (phone: string): boolean => {
    // Permitir números con + seguido de dígitos y espacios/guiones
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    // Remover espacios y guiones para validación
    const cleanPhone = phone.replace(/[\s-]/g, '');
    return phoneRegex.test(cleanPhone);
  };

  // Función para validar campos en tiempo real
  const validateField = (field: 'email' | 'phone', value: string) => {
    const newErrors = { ...errors };
    
    if (field === 'email') {
      if (!value) {
        newErrors.email = 'El correo electrónico es requerido';
      } else if (!validateEmail(value)) {
        newErrors.email = 'Ingrese un correo electrónico válido';
      } else {
        newErrors.email = '';
      }
    }
    
    if (field === 'phone') {
      if (!value) {
        newErrors.phone = 'El número de teléfono es requerido';
      } else if (!validatePhoneNumber(value)) {
        newErrors.phone = 'Ingrese un número válido (ej: +57 300 123 4567)';
      } else {
        newErrors.phone = '';
      }
    }
    
    setErrors(newErrors);
    return !newErrors[field];
  };

  const loadNotificationSettings = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/user/notification-preference/user123`);
      console.log('Configuración de notificaciones desde DynamoDB:', response.data);
      
      if (response.data) {
        setSettings({
          userId: 'user123',
          preferredMethod: response.data.preferredMethod || 'email',
          emailNotifications: response.data.preferredMethod === 'email',
          smsNotifications: response.data.preferredMethod === 'sms',
          email: response.data.email || 'camachoeva.07@gmail.com',
          phoneNumber: response.data.phoneNumber || '+57 300 123 4567',
        });
      }
    } catch (error) {
      console.error('Error loading notification settings from DynamoDB:', error);
      // Usar configuración por defecto si no existe
      setSettings({
        userId: 'user123',
        preferredMethod: 'email',
        emailNotifications: true,
        smsNotifications: false,
        email: 'camachoeva.07@gmail.com',
        phoneNumber: '+57 300 123 4567',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreferredMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const method = event.target.value as 'email' | 'sms';
    setSettings(prev => ({
      ...prev,
      preferredMethod: method,
      emailNotifications: method === 'email',
      smsNotifications: method === 'sms',
    }));
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const email = event.target.value;
    setSettings(prev => ({
      ...prev,
      email: email,
    }));
    // Validar en tiempo real
    validateField('email', email);
  };

  const handlePhoneNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const phone = event.target.value;
    setSettings(prev => ({
      ...prev,
      phoneNumber: phone,
    }));
    // Validar en tiempo real
    validateField('phone', phone);
  };

  const saveSettings = async () => {
    // Validar todos los campos antes de guardar
    const emailValid = validateField('email', settings.email);
    const phoneValid = validateField('phone', settings.phoneNumber);
    
    if (!emailValid || !phoneValid) {
      setSnackbar({
        open: true,
        message: 'Por favor corrija los errores en el formulario',
        severity: 'error'
      });
      return;
    }

    setSaving(true);
    try {
      await axios.patch(`http://localhost:3000/api/user/notification-preferences`, {
        userId: 'user123',
        preferredMethod: settings.preferredMethod,
        email: settings.email,
        phoneNumber: settings.phoneNumber
      });

      setSnackbar({
        open: true,
        message: 'Configuración de notificaciones guardada exitosamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving notification settings to DynamoDB:', error);
      setSnackbar({
        open: true,
        message: 'Error al guardar la configuración de notificaciones',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={3}>
            <Person sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="bold">
              Información de Contacto
            </Typography>
          </Box>
          
          <Box display="flex" flexDirection="column" gap={3} mb={4}>
            <TextField
              fullWidth
              label="Correo Electrónico"
              type="email"
              value={settings.email}
              onChange={handleEmailChange}
              error={!!errors.email}
              helperText={errors.email || "Ingresa tu correo electrónico para recibir notificaciones"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              label="Número de Teléfono"
              type="tel"
              value={settings.phoneNumber}
              onChange={handlePhoneNumberChange}
              error={!!errors.phone}
              helperText={errors.phone || "Ingresa tu número de teléfono para recibir SMS (ej: +57 300 123 4567)"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box display="flex" alignItems="center" mb={2}>
            <Notifications sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="bold">
              Método de Notificación Preferido
            </Typography>
          </Box>
          
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">
              Selecciona cómo prefieres recibir las notificaciones:
            </FormLabel>
            <RadioGroup
              value={settings.preferredMethod}
              onChange={handlePreferredMethodChange}
              sx={{ mt: 1 }}
            >
              <FormControlLabel
                value="email"
                control={<Radio />}
                label={
                  <Box display="flex" alignItems="center">
                    <Email sx={{ mr: 1, color: 'info.main' }} />
                    <Box>
                      <Typography variant="body1">Correo Electrónico</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Recibe notificaciones por email ({settings.email})
                      </Typography>
                    </Box>
                  </Box>
                }
              />
              <FormControlLabel
                value="sms"
                control={<Radio />}
                label={
                  <Box display="flex" alignItems="center">
                    <Sms sx={{ mr: 1, color: 'success.main' }} />
                    <Box>
                      <Typography variant="body1">Mensaje de Texto (SMS)</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Recibe notificaciones por SMS ({settings.phoneNumber})
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>

          <Box mt={3}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Recibirás notificaciones sobre:
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" color="text.secondary">
                Confirmaciones de suscripciones exitosas
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Notificaciones de cancelaciones de fondos
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Actualizaciones importantes de tu portafolio
              </Typography>
            </Box>
          </Box>

          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={saveSettings}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <Notifications />}
            >
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationSettings;
