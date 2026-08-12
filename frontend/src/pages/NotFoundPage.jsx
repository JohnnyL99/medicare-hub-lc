import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import { Button, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <Paper
      sx={{
        p: { xs: 4, md: 6 },
        borderRadius: 6,
        border: '1px solid',
        borderColor: 'divider',
        textAlign: 'center'
      }}
    >
      <Stack spacing={2} alignItems="center">
        <RouteOutlinedIcon color="primary" sx={{ fontSize: 48 }} />
        <Typography variant="overline" color="primary" fontWeight={800}>
          Errore 404
        </Typography>
        <Typography variant="h3">Pagina non trovata</Typography>
        <Typography variant="body1" color="text.secondary" maxWidth={520}>
          Il percorso richiesto non esiste oppure non e ancora stato collegato
          nell&apos;architettura frontend di MediCare Hub.
        </Typography>
        <Button
          component={RouterLink}
          to="/dashboard"
          variant="contained"
          startIcon={<ArrowBackOutlinedIcon />}
        >
          Torna alla dashboard
        </Button>
      </Stack>
    </Paper>
  );
}
