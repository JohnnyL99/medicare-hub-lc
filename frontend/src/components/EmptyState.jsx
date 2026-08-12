import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { Alert, Button, Card, CardContent, Stack, Typography } from '@mui/material';

export function EmptyState({
  title = 'Nessun contenuto disponibile',
  description = 'Il modulo e pronto, ma non ci sono ancora elementi da mostrare.',
  actionLabel,
  onAction
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2.5} alignItems="center" justifyContent="center" sx={{ minHeight: 220 }}>
          <Alert icon={<InboxOutlinedIcon fontSize="inherit" />} severity="info" variant="outlined">
            Nessun elemento disponibile
          </Alert>
          <Stack spacing={0.5} alignItems="center">
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {description}
            </Typography>
          </Stack>
          {actionLabel ? (
            <Button variant="contained" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
