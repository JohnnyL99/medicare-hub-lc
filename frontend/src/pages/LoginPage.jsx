import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSnackbar } from '../contexts/SnackbarContext';
import { appConfig } from '../utils/appConfig';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [formState, setFormState] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  function validate() {
    const nextErrors = {};

    if (!formState.email.trim()) {
      nextErrors.email = 'Inserisci l email';
    } else if (!/^\S+@\S+\.\S+$/.test(formState.email.trim())) {
      nextErrors.email = 'Inserisci un indirizzo email valido';
    }

    if (!formState.password) {
      nextErrors.password = 'Inserisci la password';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login({
        email: formState.email.trim().toLowerCase(),
        password: formState.password
      });

      showSnackbar('Accesso effettuato correttamente', 'success');

      navigate(location.state?.from || '/dashboard', {
        replace: true
      });
    } catch (error) {
      setErrors({
        form: error.message || 'Accesso non riuscito'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant="overline" color="primary" fontWeight={800}>
              Accesso applicativo
            </Typography>
            <Typography variant="h3">MediCare Hub</Typography>
            <Typography variant="body1" color="text.secondary">
              Accesso al gestionale del {appConfig.clinicName}.
            </Typography>
          </Stack>

          {errors.form ? (
            <Alert severity="error" variant="outlined">
              {errors.form}
            </Alert>
          ) : null}

          <Stack spacing={2} component="form" onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              autoComplete="username"
              value={formState.email}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  email: event.target.value
                }))
              }
              error={Boolean(errors.email)}
              helperText={errors.email}
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              autoComplete="current-password"
              value={formState.password}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  password: event.target.value
                }))
              }
              error={Boolean(errors.password)}
              helperText={errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                      onClick={() => setShowPassword((current) => !current)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<LockOutlinedIcon />}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Accedi
            </Button>
          </Stack>

          <Divider />

          <Alert severity="info" variant="outlined">
            L applicazione utilizza esclusivamente dati fittizi per scopi accademici e di
            prototipazione.
          </Alert>
        </Stack>
      </CardContent>
    </Card>
  );
}
