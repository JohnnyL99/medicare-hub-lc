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
import { useMemo, useState } from 'react';
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
import { formatDateTime } from '../utils/formatters';
import { hasRole } from '../utils/permissions';
import { getStatusValue, toBooleanFilter } from './pageHelpers';

const initialFormState = {
  name: '',
  description: '',
  isActive: true
};

export function SpecialtiesPage() {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const canManage = hasRole(user, ['ADMIN']);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusDialog, setStatusDialog] = useState(null);
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
    fetcher: specialtiesApi.list,
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

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormValues(initialFormState);
    setDialogOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormValues({
      name: item.name || '',
      description: item.description || '',
      isActive: item.isActive
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      if (editingItem) {
        await specialtiesApi.update(editingItem.id, formValues);
        showSnackbar('Specializzazione aggiornata con successo', 'success');
      } else {
        await specialtiesApi.create(formValues);
        showSnackbar('Specializzazione creata con successo', 'success');
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
      await specialtiesApi.updateStatus(statusDialog.id, !statusDialog.isActive);
      showSnackbar('Stato specializzazione aggiornato', 'success');
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
        headerName: 'Nome',
        flex: 1.1,
        minWidth: 220
      },
      {
        field: 'description',
        headerName: 'Descrizione',
        flex: 1.6,
        minWidth: 260,
        sortable: false,
        renderCell: ({ row }) => (
          <Typography variant="body2" color="text.secondary">
            {row.description || 'Nessuna descrizione'}
          </Typography>
        )
      },
      {
        field: 'isActive',
        headerName: 'Stato',
        minWidth: 150,
        renderCell: ({ row }) => <StatusChip status={getStatusValue(row.isActive)} />
      },
      {
        field: 'updatedAt',
        headerName: 'Ultimo aggiornamento',
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
        title="Specializzazioni"
        description="Gestione del catalogo delle specializzazioni cliniche disponibili per il Centro Medico Aurora."
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
        emptyTitle="Nessuna specializzazione trovata"
        emptyDescription="Modifica i filtri oppure crea la prima specializzazione disponibile a catalogo."
        emptyActionLabel={canManage ? 'Nuova specializzazione' : undefined}
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
                  Nuova specializzazione
                </Button>
              ) : null
            }
          />
        }
      />

      <FormDialog
        open={dialogOpen}
        title={editingItem ? 'Modifica specializzazione' : 'Nuova specializzazione'}
        submitLabel={editingItem ? 'Salva modifiche' : 'Crea specializzazione'}
        isSubmitting={isSubmitting}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
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
              <MenuItem value="true">Attiva</MenuItem>
              <MenuItem value="false">Non attiva</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(statusDialog)}
        title={statusDialog?.isActive ? 'Disattivare specializzazione?' : 'Attivare specializzazione?'}
        description={
          statusDialog?.isActive
            ? 'La specializzazione non sara piu disponibile per nuove associazioni attive.'
            : 'La specializzazione tornera disponibile per il catalogo applicativo.'
        }
        confirmLabel={statusDialog?.isActive ? 'Disattiva' : 'Attiva'}
        confirmColor={statusDialog?.isActive ? 'warning' : 'primary'}
        onClose={() => setStatusDialog(null)}
        onConfirm={handleStatusChange}
      />
    </Stack>
  );
}
