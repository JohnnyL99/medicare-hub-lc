import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { doctorsApi } from '../api/doctorsApi';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useAuth } from '../hooks/useAuth';

export function ProfilePage() {
  const { logout, user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const isDoctor = user?.role === 'DOCTOR';
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [loadingDoctorTools, setLoadingDoctorTools] = useState(isDoctor);
  const [doctorToolsError, setDoctorToolsError] = useState('');
  const [isSavingServices, setIsSavingServices] = useState(false);

  useEffect(() => {
    if (!isDoctor) {
      return;
    }

    let active = true;

    async function loadDoctorTools() {
      setLoadingDoctorTools(true);
      setDoctorToolsError('');

      try {
        const [doctorResponse, servicesResponse] = await Promise.all([
          doctorsApi.getCurrent(),
          doctorsApi.listAvailableForCurrent()
        ]);

        if (!active) {
          return;
        }

        setDoctorProfile(doctorResponse);
        setAvailableServices(Array.isArray(servicesResponse) ? servicesResponse : []);
        setSelectedServiceIds(
          Array.isArray(doctorResponse.medicalServices)
            ? doctorResponse.medicalServices.map((service) => service.id)
            : []
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setDoctorToolsError(error.message);
      } finally {
        if (active) {
          setLoadingDoctorTools(false);
        }
      }
    }

    loadDoctorTools();

    return () => {
      active = false;
    };
  }, [isDoctor]);

  const selectedServices = availableServices.filter((service) => selectedServiceIds.includes(service.id));

  const handleSaveServices = async () => {
    setIsSavingServices(true);

    try {
      const updatedDoctor = await doctorsApi.replaceCurrentServices(selectedServiceIds);
      setDoctorProfile(updatedDoctor);
      setSelectedServiceIds(
        Array.isArray(updatedDoctor.medicalServices)
          ? updatedDoctor.medicalServices.map((service) => service.id)
          : []
      );
      showSnackbar('Prestazioni personali aggiornate con successo', 'success');
    } catch (error) {
      showSnackbar(error.message, 'error');
    } finally {
      setIsSavingServices(false);
    }
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        eyebrow="Profilo"
        title="Profilo utente"
        description={
          isDoctor
            ? 'Profilo del medico con gestione autonoma delle prestazioni erogabili e dati operativi essenziali.'
            : 'Vista iniziale del profilo autenticato, predisposta per preferenze, dati personali e sicurezza.'
        }
      />

      <Paper sx={{ p: 4, borderRadius: 5 }}>
        <Stack spacing={2}>
          <Typography variant="h6">
            {user.firstName} {user.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Profilo autenticato caricato dalla sessione applicativa.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ruolo: <strong>{user.role}</strong>
          </Typography>
          <StatusChip status="ACTIVE" />
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<LogoutOutlinedIcon />}
            onClick={() => logout()}
            sx={{ alignSelf: 'flex-start' }}
          >
            Esci
          </Button>
        </Stack>
      </Paper>

      {isDoctor ? (
        <Paper sx={{ p: 4, borderRadius: 5 }}>
          {loadingDoctorTools ? (
            <LoadingState description="Recupero del profilo medico e delle prestazioni disponibili." />
          ) : (
            <Stack spacing={3}>
              <Stack spacing={0.75}>
                <Typography variant="h6">Prestazioni del medico</Typography>
                <Typography variant="body2" color="text.secondary">
                  Il medico puo aggiornare autonomamente le proprie prestazioni. La creazione e la gestione degli appuntamenti restano in capo alla segreteria.
                </Typography>
              </Stack>

              {doctorToolsError ? <Alert severity="error">{doctorToolsError}</Alert> : null}

              {doctorProfile ? (
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    Specializzazione: <strong>{doctorProfile.specialty?.name || '-'}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Licenza fittizia: <strong>{doctorProfile.licenseNumber || '-'}</strong>
                  </Typography>
                </Stack>
              ) : null}

              <Autocomplete
                multiple
                options={availableServices}
                value={selectedServices}
                getOptionLabel={(option) =>
                  option.specialty?.name ? `${option.name} · ${option.specialty.name}` : option.name
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_event, value) => {
                  setSelectedServiceIds(value.map((service) => service.id));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Prestazioni assegnate"
                    placeholder="Seleziona una o piu prestazioni"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      label={option.name}
                      size="small"
                    />
                  ))
                }
              />

              <Button
                variant="contained"
                startIcon={<SaveOutlinedIcon />}
                onClick={handleSaveServices}
                disabled={isSavingServices}
                sx={{ alignSelf: 'flex-start' }}
              >
                Salva prestazioni
              </Button>
            </Stack>
          )}
        </Paper>
      ) : null}
    </Stack>
  );
}
