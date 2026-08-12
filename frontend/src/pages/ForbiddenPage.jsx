import LockPersonOutlinedIcon from '@mui/icons-material/LockPersonOutlined';
import { Button, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export function ForbiddenPage() {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 4, md: 6 },
        textAlign: 'center'
      }}
    >
      <Stack spacing={2} alignItems="center">
        <LockPersonOutlinedIcon color="warning" sx={{ fontSize: 48 }} />
        <Typography variant="overline" color="warning.main" fontWeight={800}>
          Errore 403
        </Typography>
        <Typography variant="h3">Accesso non autorizzato</Typography>
        <Typography variant="body1" color="text.secondary" maxWidth={540}>
          Il ruolo corrente non ha i permessi necessari per accedere a questa sezione.
        </Typography>
        <Button component={RouterLink} to="/dashboard" variant="contained">
          Torna alla dashboard
        </Button>
      </Stack>
    </Paper>
  );
}
