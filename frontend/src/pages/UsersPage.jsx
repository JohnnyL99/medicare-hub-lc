import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import {
  Button,
  Grid,
  MenuItem,
  Stack,
  TextField
} from '@mui/material';
import { GridActionsCellItem } from '@mui/x-data-grid';
import { useMemo, useState } from 'react';
import { usersApi } from '../api/usersApi';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EntityDataGridCard } from '../components/EntityDataGridCard';
import { EntityToolbar } from '../components/EntityToolbar';
import { FormDialog } from '../components/FormDialog';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useServerCollection } from '../hooks/useServerCollection';
import { formatDateTime } from '../utils/formatters';
import { getStatusValue, toBooleanFilter } from './pageHelpers';

const initialFormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'RECEPTIONIST',
  isActive: true
};

export function UsersPage() {
  const { showSnackbar } = useSnackbar();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusDialog, setStatusDialog] = useState(null);
  const [draftFilters, setDraftFilters] = useState({
    name: '',
    role: 'all',
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
    fetcher: usersApi.list,
    initialFilters: {
      page: 1,
      pageSize: 10,
      name: '',
      role: undefined,
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
      email: item.email || '',
      password: '',
      role: item.role || 'RECEPTIONIST',
      isActive: item.isActive
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      email: formValues.email,
      role: formValues.role,
      isActive: formValues.isActive
    };

    if (!editingItem) {
      payload.password = formValues.password;
    }

    setIsSubmitting(true);

    try {
      if (editingItem) {
        await usersApi.update(editingItem.id, payload);
        showSnackbar('Utente aggiornato con successo', 'success');
      } else {
        await usersApi.create(payload);
        showSnackbar('Utente creato con successo', 'success');
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
      await usersApi.updateStatus(statusDialog.id, !statusDialog.isActive);
      showSnackbar('Stato utente aggiornato', 'success');
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
        field: 'firstName',
        headerName: 'Nome',
        flex: 1,
        minWidth: 140
      },
      {
        field: 'lastName',
        headerName: 'Cognome',
        flex: 1,
        minWidth: 140
      },
      {
        field: 'email',
        headerName: 'Email',
        flex: 1.4,
        minWidth: 240
      },
      {
        field: 'role',
        headerName: 'Ruolo',
        minWidth: 160
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
        getActions: ({ row }) => [
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
      }
    ],
    []
  );

  return (
    <Stack spacing={4}>
      <PageHeader
        eyebrow="Amministrazione"
        title="Utenti"
        description="Anagrafica utenti interni con ruoli applicativi, stato dell'utenza e manutenzione amministrativa."
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
        emptyTitle="Nessun utente trovato"
        emptyDescription="Registra il primo utente interno oppure amplia i filtri di ricerca."
        emptyActionLabel="Nuovo utente"
        onEmptyAction={handleOpenCreate}
        toolbar={
          <EntityToolbar
            searchLabel="Ricerca per nome o email"
            searchValue={draftFilters.name}
            onSearchChange={(value) => setDraftFilters((current) => ({ ...current, name: value }))}
            statusValue={draftFilters.isActive}
            onStatusChange={(value) =>
              setDraftFilters((current) => ({ ...current, isActive: value }))
            }
            extraFilters={
              <TextField
                select
                label="Ruolo"
                value={draftFilters.role}
                onChange={(event) =>
                  setDraftFilters((current) => ({ ...current, role: event.target.value }))
                }
                sx={{ minWidth: { xs: '100%', sm: 220 } }}
              >
                <MenuItem value="all">Tutti i ruoli</MenuItem>
                <MenuItem value="ADMIN">ADMIN</MenuItem>
                <MenuItem value="RECEPTIONIST">RECEPTIONIST</MenuItem>
                <MenuItem value="DOCTOR">DOCTOR</MenuItem>
              </TextField>
            }
            onSubmit={() =>
              setFilters({
                name: draftFilters.name.trim(),
                role: draftFilters.role === 'all' ? undefined : draftFilters.role,
                isActive: toBooleanFilter(draftFilters.isActive)
              })
            }
            onReset={() => {
              const reset = {
                name: '',
                role: 'all',
                isActive: 'all'
              };
              setDraftFilters(reset);
              setFilters({
                name: '',
                role: undefined,
                isActive: undefined
              });
            }}
            actions={
              <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={handleOpenCreate}>
                Nuovo utente
              </Button>
            }
          />
        }
      />

      <FormDialog
        open={dialogOpen}
        title={editingItem ? 'Modifica utente' : 'Nuovo utente'}
        submitLabel={editingItem ? 'Salva modifiche' : 'Crea utente'}
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
          <Grid size={{ xs: 12, md: editingItem ? 6 : 12 }}>
            <TextField
              label="Email"
              type="email"
              value={formValues.email}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, email: event.target.value }))
              }
              fullWidth
              required
            />
          </Grid>
          {!editingItem ? (
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Password iniziale"
                type="password"
                value={formValues.password}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, password: event.target.value }))
                }
                fullWidth
                required
              />
            </Grid>
          ) : null}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              label="Ruolo"
              value={formValues.role}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, role: event.target.value }))
              }
              fullWidth
              required
            >
              <MenuItem value="ADMIN">ADMIN</MenuItem>
              <MenuItem value="RECEPTIONIST">RECEPTIONIST</MenuItem>
              <MenuItem value="DOCTOR">DOCTOR</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
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
        title={statusDialog?.isActive ? 'Disattivare utente?' : 'Attivare utente?'}
        description={
          statusDialog?.isActive
            ? 'L utente non potra piu autenticarsi finche restera disattivato.'
            : 'L utente potra tornare ad autenticarsi e usare le funzioni permesse dal ruolo.'
        }
        confirmLabel={statusDialog?.isActive ? 'Disattiva' : 'Attiva'}
        confirmColor={statusDialog?.isActive ? 'warning' : 'primary'}
        onClose={() => setStatusDialog(null)}
        onConfirm={handleStatusChange}
      />
    </Stack>
  );
}
