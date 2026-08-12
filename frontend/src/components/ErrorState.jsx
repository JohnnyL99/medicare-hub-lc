import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { Alert, Button, Card, CardContent, Stack, Typography } from '@mui/material';

export function ErrorState({
  title = 'Si e verificato un errore',
  description = 'La vista non puo essere caricata in questo momento.',
  actionLabel = 'Riprova',
  onAction
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2.5} alignItems="center" justifyContent="center" sx={{ minHeight: 220 }}>
          <Alert
            icon={<ErrorOutlineOutlinedIcon fontSize="inherit" />}
            severity="error"
            variant="outlined"
          >
            Errore di caricamento
          </Alert>
          <Stack spacing={0.5} alignItems="center">
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {description}
            </Typography>
          </Stack>
          {onAction ? (
            <Button variant="outlined" color="error" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
