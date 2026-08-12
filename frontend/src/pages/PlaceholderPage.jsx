import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import { Alert, Paper, Stack } from '@mui/material';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';

export function PlaceholderPage({ eyebrow, title, description, note }) {
  return (
    <Stack spacing={3}>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 5 }}>
        <Stack spacing={3}>
          <Alert severity="info" icon={<ConstructionOutlinedIcon fontSize="inherit" />}>
            Placeholder iniziale del modulo. Le integrazioni API verranno introdotte nelle
            sessioni successive.
          </Alert>

          <EmptyState
            title={`${title} pronto per l'integrazione`}
            description={note || 'La struttura UI e il routing sono attivi, ma i contenuti operativi non sono ancora implementati.'}
          />
        </Stack>
      </Paper>
    </Stack>
  );
}
