import { Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';

export function LoadingState({
  title = 'Caricamento in corso',
  description = 'Preparazione dei contenuti del modulo.'
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ minHeight: 220 }}>
          <CircularProgress size={36} />
          <Stack spacing={0.5} alignItems="center">
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
