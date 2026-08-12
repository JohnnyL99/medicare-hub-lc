import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import { DatePicker } from '@mui/x-date-pickers';
import {
  Button,
  Chip,
  Grid,
  MenuItem,
  Stack,
  TextField
} from '@mui/material';
import { GridActionsCellItem } from '@mui/x-data-grid';
import { useMemo, useState } from 'react';
import { patientsApi } from '../api/patientsApi';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EntityDataGridCard } from '../components/EntityDataGridCard';
import { EntityToolbar } from '../components/EntityToolbar';
import { FormDialog } from '../components/FormDialog';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useServerCollection } from '../hooks/useServerCollection';
import { useAuth } from '../hooks/useAuth';
import { formatDate, formatDateTime } from '../utils/formatters';
import { hasRole } from '../utils/permissions';
import { getStatusValue, toApiDate, toBooleanFilter, toDatePickerValue } from './pageHelpers';

const initialFormState = {
  firstName: '',
  lastName: '',
  birthDate: '',
  email: '',
  phone: '',
  fiscalCode: '',
  isActive: true
};

export function PatientsPage() {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const isDoctor = hasRole(user, ['DOCTOR']);
  const canCreate = hasRole(user, ['ADMIN', 'RECEPTIONIST', 'DOCTOR']);
  const canManage = hasRole(user, ['ADMIN', 'RECEPTIONIST']);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusDialog, setStatusDialog] = useState(null);
  const [draftFilters, setDraftFilters] = useState({
    search: '',
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
    fetcher: patientsApi.list,
    initialFilters: {
      page: 1,
      pageSize: 10,
      search: '',
      isActive: undefined
    },
    defaultSort: {
      field: 'lastName',
      direction: 'asc'
    }
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormValues(initialFormState);
    setDialogOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormValues({
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      birthDate: item.birthDate || '',
      email: item.email || '',
      phone: item.phone || '',
      fiscalCode: item.fiscalCode || '',
      isActive: item.isActive
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      ...formValues,
      birthDate: toApiDate(formValues.birthDate),
      email: formValues.email || null,
      fiscalCode: formValues.fiscalCode || null
    };

    setIsSubmitting(true);

    try {
      if (editingItem) {
        await patientsApi.update(editingItem.id, payload);
        showSnackbar('Paziente aggiornato con successo', 'success');
      } else {
        await patientsApi.create(payload);
        showSnackbar('Paziente creato con successo', 'success');
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
      await patientsApi.updateStatus(statusDialog.id, !statusDialog.isActive);
      showSnackbar('Stato paziente aggiornato', 'success');
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
        field: 'lastName',
        headerName: 'Paziente',
        flex: 1.2,
        minWidth: 220,
        renderCell: ({ row }) => `${row.firstName} ${row.lastName}`
      },
      {
        field: 'birthDate',
        headerName: 'Data di nascita',
        minWidth: 150,
        valueFormatter: (value) => formatDate(value)
      },
      {
        field: 'email',
        headerName: 'Email',
        flex: 1,
        minWidth: 220
      },
      {
        field: 'phone',
        headerName: 'Telefono',
        minWidth: 160
      },
      {
        field: 'fiscalCode',
        headerName: 'Codice fittizio',
        minWidth: 180,
        sortable: false
      },
      {
        field: 'isActive',
        headerName: 'Stato',
        minWidth: 140,
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
        eyebrow="Anagrafica"
        title="Pazienti"
        description={
          isDoctor
            ? 'Vista limitata ai pazienti collegati ai propri appuntamenti, con possibilita di registrare nuovi pazienti per la clinica.'
            : 'Archivio anagrafico dei pazienti fittizi con ricerca server-side e gestione dello stato operativo.'
        }
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
        emptyTitle="Nessun paziente trovato"
        emptyDescription="Non ci sono pazienti compatibili con i filtri selezionati."
        emptyActionLabel={canCreate ? 'Nuovo paziente' : undefined}
        onEmptyAction={canCreate ? handleOpenCreate : undefined}
        toolbar={
          <EntityToolbar
            searchLabel="Ricerca per nome, email o codice"
            searchValue={draftFilters.search}
            onSearchChange={(value) =>
              setDraftFilters((current) => ({ ...current, search: value }))
            }
            statusValue={draftFilters.isActive}
            onStatusChange={(value) =>
              setDraftFilters((current) => ({ ...current, isActive: value }))
            }
            onSubmit={() =>
              setFilters({
                search: draftFilters.search.trim(),
                isActive: toBooleanFilter(draftFilters.isActive)
              })
            }
            onReset={() => {
              const reset = {
                search: '',
                isActive: 'all'
              };
              setDraftFilters(reset);
              setFilters({
                search: '',
                isActive: undefined
              });
            }}
            actions={
              canCreate ? (
                <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={handleOpenCreate}>
                  Nuovo paziente
                </Button>
              ) : isDoctor ? (
                <Chip
                  color="info"
                  label="Solo pazienti collegati ai tuoi appuntamenti"
                  variant="outlined"
                />
              ) : null
            }
          />
        }
      />

      <FormDialog
        open={dialogOpen}
        title={editingItem ? 'Modifica paziente' : 'Nuovo paziente'}
        submitLabel={editingItem ? 'Salva modifiche' : 'Crea paziente'}
        isSubmitting={isSubmitting}
        maxWidth="md"
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Nome"
              value={formValues.firstName}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, firstName: event.target.value }))
              }
              fullWidth
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Cognome"
              value={formValues.lastName}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, lastName: event.target.value }))
              }
              fullWidth
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <DatePicker
              label="Data di nascita"
              value={toDatePickerValue(formValues.birthDate)}
              onChange={(value) =>
                setFormValues((current) => ({
                  ...current,
                  birthDate: toApiDate(value)
                }))
              }
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Telefono"
              value={formValues.phone}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, phone: event.target.value }))
              }
              fullWidth
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Email"
              type="email"
              value={formValues.email}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, email: event.target.value }))
              }
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Codice fittizio opzionale"
              value={formValues.fiscalCode}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, fiscalCode: event.target.value }))
              }
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
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
              <MenuItem value="true">Attivo</MenuItem>
              <MenuItem value="false">Non attivo</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(statusDialog)}
        title={statusDialog?.isActive ? 'Disattivare paziente?' : 'Attivare paziente?'}
        description={
          statusDialog?.isActive
            ? 'Il paziente restera nel sistema per storico appuntamenti ma non sara considerato attivo.'
            : 'Il paziente tornera disponibile per nuove attivita di prenotazione.'
        }
        confirmLabel={statusDialog?.isActive ? 'Disattiva' : 'Attiva'}
        confirmColor={statusDialog?.isActive ? 'warning' : 'primary'}
        onClose={() => setStatusDialog(null)}
        onConfirm={handleStatusChange}
      />
    </Stack>
  );
}
