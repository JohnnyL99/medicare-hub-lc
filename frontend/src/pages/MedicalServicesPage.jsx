import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import {
  Button,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { GridActionsCellItem } from '@mui/x-data-grid';
import { useEffect, useMemo, useState } from 'react';
import { medicalServicesApi } from '../api/medicalServicesApi';
import { specialtiesApi } from '../api/specialtiesApi';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EntityDataGridCard } from '../components/EntityDataGridCard';
import { EntityToolbar } from '../components/EntityToolbar';
import { FormDialog } from '../components/FormDialog';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useServerCollection } from '../hooks/useServerCollection';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { hasRole } from '../utils/permissions';
import { getStatusValue, toBooleanFilter } from './pageHelpers';

const initialFormState = {
  specialtyId: '',
  name: '',
  description: '',
  durationMinutes: '',
  currentPrice: '',
  isActive: true
};

export function MedicalServicesPage() {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const canManage = hasRole(user, ['ADMIN']);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusDialog, setStatusDialog] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [draftFilters, setDraftFilters] = useState({
    name: '',
    isActive: 'all'
  });
  const [formValues, setFormValues] = useState(initialFormState);

  const {
    rows,
    meta,
    loading,
    error,
    sortModel,
    paginationModel,
    setSortModel,
    setPaginationModel,
    setFilters,
    reload
  } = useServerCollection({
    fetcher: medicalServicesApi.list,
    initialFilters: {
      page: 1,
      pageSize: 10,
      name: '',
      isActive: undefined
    },
    defaultSort: {
      field: 'name',
      direction: 'asc'
    }
  });

  useEffect(() => {
    specialtiesApi
      .list({
        page: 1,
        pageSize: 100,
        isActive: 'true',
        orderBy: 'name',
        sortOrder: 'asc'
      })
      .then((response) => setSpecialties(response.data))
      .catch(() => setSpecialties([]));
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormValues(initialFormState);
    setDialogOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormValues({
      specialtyId: item.specialty?.id || '',
      name: item.name || '',
      description: item.description || '',
      durationMinutes: item.durationMinutes || '',
      currentPrice: item.currentPrice || '',
      isActive: item.isActive
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      ...formValues,
      specialtyId: Number(formValues.specialtyId),
      durationMinutes: Number(formValues.durationMinutes),
      currentPrice: Number(formValues.currentPrice)
    };

    setIsSubmitting(true);

    try {
      if (editingItem) {
        await medicalServicesApi.update(editingItem.id, payload);
        showSnackbar('Prestazione aggiornata con successo', 'success');
      } else {
        await medicalServicesApi.create(payload);
        showSnackbar('Prestazione creata con successo', 'success');
      }

      setDialogOpen(false);
      await reload();
    } catch (requestError) {
      showSnackbar(requestError.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async () => {
    if (!statusDialog) {
      return;
    }

    setIsSubmitting(true);

    try {
      await medicalServicesApi.updateStatus(statusDialog.id, !statusDialog.isActive);
      showSnackbar('Stato prestazione aggiornato', 'success');
      setStatusDialog(null);
      await reload();
    } catch (requestError) {
      showSnackbar(requestError.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Prestazione',
        flex: 1.2,
        minWidth: 240
      },
      {
        field: 'specialty',
        headerName: 'Specializzazione',
        flex: 1,
        minWidth: 180,
        sortable: false,
        renderCell: ({ row }) => row.specialty?.name || '-'
      },
      {
        field: 'durationMinutes',
        headerName: 'Durata',
        minWidth: 140,
        valueFormatter: (value) => `${value} min`
      },
      {
        field: 'currentPrice',
        headerName: 'Prezzo',
        minWidth: 130,
        valueFormatter: (value) => formatCurrency(value)
      },
      {
        field: 'isActive',
        headerName: 'Stato',
        minWidth: 150,
        renderCell: ({ row }) => <StatusChip status={getStatusValue(row.isActive)} />
      },
      {
        field: 'updatedAt',
        headerName: 'Aggiornato',
        minWidth: 180,
        valueFormatter: (value) => formatDateTime(value)
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Azioni',
        minWidth: 120,
        getActions: ({ row }) =>
          canManage
            ? [
                <GridActionsCellItem
                  key="edit"
                  icon={<EditOutlinedIcon />}
                  label="Modifica"
                  onClick={() => handleOpenEdit(row)}
                  showInMenu
                />,
                <GridActionsCellItem
                  key="status"
                  icon={row.isActive ? <ToggleOffOutlinedIcon /> : <ToggleOnOutlinedIcon />}
                  label={row.isActive ? 'Disattiva' : 'Attiva'}
                  onClick={() => setStatusDialog(row)}
                  showInMenu
                />
              ]
            : []
      }
    ],
    [canManage]
  );

  return (
    <Stack spacing={4}>
      <PageHeader
        eyebrow="Catalogo"
        title="Prestazioni mediche"
        description="Listino prestazioni con durata standard, prezzo corrente e specializzazione di riferimento."
      />

      <EntityDataGridCard
        rows={rows}
        columns={columns}
        loading={loading}
        error={error}
        rowCount={meta.totalItems}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        onRetry={reload}
        emptyTitle="Nessuna prestazione trovata"
        emptyDescription="Aggiorna i filtri oppure registra la prima prestazione nel listino."
        emptyActionLabel={canManage ? 'Nuova prestazione' : undefined}
        onEmptyAction={canManage ? handleOpenCreate : undefined}
        toolbar={
          <EntityToolbar
            searchLabel="Ricerca per nome"
            searchValue={draftFilters.name}
            onSearchChange={(value) => setDraftFilters((current) => ({ ...current, name: value }))}
            statusValue={draftFilters.isActive}
            onStatusChange={(value) =>
              setDraftFilters((current) => ({ ...current, isActive: value }))
            }
            onSubmit={() =>
              setFilters({
                name: draftFilters.name.trim(),
                isActive: toBooleanFilter(draftFilters.isActive)
              })
            }
            onReset={() => {
              const reset = {
                name: '',
                isActive: 'all'
              };
              setDraftFilters(reset);
              setFilters({
                name: '',
                isActive: undefined
              });
            }}
            actions={
              canManage ? (
                <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={handleOpenCreate}>
                  Nuova prestazione
                </Button>
              ) : null
            }
          />
        }
      />

      <FormDialog
        open={dialogOpen}
        title={editingItem ? 'Modifica prestazione' : 'Nuova prestazione'}
        submitLabel={editingItem ? 'Salva modifiche' : 'Crea prestazione'}
        isSubmitting={isSubmitting}
        maxWidth="md"
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              label="Specializzazione"
              value={String(formValues.specialtyId)}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, specialtyId: event.target.value }))
              }
              fullWidth
              required
            >
              {specialties.map((specialty) => (
                <MenuItem key={specialty.id} value={String(specialty.id)}>
                  {specialty.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Nome"
              value={formValues.name}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, name: event.target.value }))
              }
              fullWidth
              required
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Descrizione"
              value={formValues.description}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, description: event.target.value }))
              }
              fullWidth
              multiline
              minRows={3}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label="Durata in minuti"
              type="number"
              value={formValues.durationMinutes}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  durationMinutes: event.target.value
                }))
              }
              fullWidth
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label="Prezzo corrente"
              type="number"
              value={formValues.currentPrice}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  currentPrice: event.target.value
                }))
              }
              fullWidth
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              label="Stato"
              value={String(formValues.isActive)}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  isActive: event.target.value === 'true'
                }))
              }
              fullWidth
            >
              <MenuItem value="true">Attiva</MenuItem>
              <MenuItem value="false">Non attiva</MenuItem>
            </TextField>
          </Grid>
          {editingItem?.description ? (
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" color="text.secondary">
                La modifica usa esclusivamente gli endpoint backend reali esposti sotto
                `/api/v1/medical-services`.
              </Typography>
            </Grid>
          ) : null}
        </Grid>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(statusDialog)}
        title={statusDialog?.isActive ? 'Disattivare prestazione?' : 'Attivare prestazione?'}
        description={
          statusDialog?.isActive
            ? 'La prestazione restera storicamente visibile ma non potra essere usata per nuove assegnazioni attive.'
            : 'La prestazione tornera disponibile nel listino e nelle associazioni consentite.'
        }
        confirmLabel={statusDialog?.isActive ? 'Disattiva' : 'Attiva'}
        confirmColor={statusDialog?.isActive ? 'warning' : 'primary'}
        onClose={() => setStatusDialog(null)}
        onConfirm={handleStatusChange}
      />
    </Stack>
  );
}
