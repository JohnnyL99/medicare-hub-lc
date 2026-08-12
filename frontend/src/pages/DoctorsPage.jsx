import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EditCalendarOutlinedIcon from '@mui/icons-material/EditCalendarOutlined';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import {
  Autocomplete,
  Alert,
  Button,
  Chip,
  Grid,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { GridActionsCellItem } from '@mui/x-data-grid';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { availabilityApi } from '../api/availabilityApi';
import { doctorsApi } from '../api/doctorsApi';
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
import { formatDateTime } from '../utils/formatters';
import { hasRole } from '../utils/permissions';
import { getStatusValue, toBooleanFilter } from './pageHelpers';

const initialFormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  specialtyId: '',
  licenseNumber: '',
  biography: '',
  medicalServiceIds: [],
  isActive: true
};

const initialAvailabilityFormState = {
  id: null,
  weekday: '1',
  startTime: '09:00',
  endTime: '13:00',
  isActive: true
};

const weekdayOptions = [
  { value: '1', label: 'Lunedi' },
  { value: '2', label: 'Martedi' },
  { value: '3', label: 'Mercoledi' },
  { value: '4', label: 'Giovedi' },
  { value: '5', label: 'Venerdi' },
  { value: '6', label: 'Sabato' },
  { value: '7', label: 'Domenica' }
];

function getWeekdayLabel(value) {
  return weekdayOptions.find((option) => option.value === String(value))?.label || String(value);
}

export function DoctorsPage() {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const canManage = hasRole(user, ['ADMIN']);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusDialog, setStatusDialog] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [medicalServices, setMedicalServices] = useState([]);
  const [availabilityDialog, setAvailabilityDialog] = useState({
    open: false,
    doctor: null
  });
  const [availabilities, setAvailabilities] = useState([]);
  const [availabilityFormValues, setAvailabilityFormValues] = useState(initialAvailabilityFormState);
  const [availabilityError, setAvailabilityError] = useState('');
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);
  const [isAvailabilitySubmitting, setIsAvailabilitySubmitting] = useState(false);
  const [availabilityDeleteDialog, setAvailabilityDeleteDialog] = useState(null);
  const [draftFilters, setDraftFilters] = useState({
    name: '',
    specialtyId: 'all',
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
    fetcher: doctorsApi.list,
    initialFilters: {
      page: 1,
      pageSize: 10,
      name: '',
      specialtyId: undefined,
      isActive: undefined
    },
    defaultSort: {
      field: 'lastName',
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

    medicalServicesApi
      .list({
        page: 1,
        pageSize: 100,
        isActive: 'true',
        orderBy: 'name',
        sortOrder: 'asc'
      })
      .then((response) => setMedicalServices(response.data))
      .catch(() => setMedicalServices([]));
  }, []);

  const loadAvailabilities = useCallback(async (doctor) => {
    setIsAvailabilityLoading(true);
    setAvailabilityError('');

    try {
      const response = await availabilityApi.listByDoctor(doctor.id);
      setAvailabilities(Array.isArray(response) ? response : []);
    } catch (requestError) {
      setAvailabilities([]);
      setAvailabilityError(requestError.message);
    } finally {
      setIsAvailabilityLoading(false);
    }
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormValues(initialFormState);
    setDialogOpen(true);
  };

  const resetAvailabilityForm = () => {
    setAvailabilityFormValues(initialAvailabilityFormState);
    setAvailabilityError('');
  };

  const openAvailabilityDialog = async (doctor) => {
    setAvailabilityDialog({
      open: true,
      doctor
    });
    resetAvailabilityForm();
    await loadAvailabilities(doctor);
  };

  const closeAvailabilityDialog = () => {
    setAvailabilityDialog({
      open: false,
      doctor: null
    });
    setAvailabilities([]);
    setAvailabilityDeleteDialog(null);
    resetAvailabilityForm();
  };

  const handleOpenEdit = async (item) => {
    try {
      const doctor = await doctorsApi.getById(item.id);

      setEditingItem(doctor);
      setFormValues({
        firstName: doctor.user?.firstName || '',
        lastName: doctor.user?.lastName || '',
        email: doctor.user?.email || '',
        password: '',
        specialtyId: doctor.specialty?.id || '',
        licenseNumber: doctor.licenseNumber || '',
        biography: doctor.biography || '',
        medicalServiceIds: doctor.medicalServices?.map((service) => service.id) || [],
        isActive: doctor.isActive
      });
      setDialogOpen(true);
    } catch (requestError) {
      showSnackbar(requestError.message, 'error');
    }
  };

  const handleSubmit = async () => {
    const payload = {
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      email: formValues.email,
      specialtyId: Number(formValues.specialtyId),
      licenseNumber: formValues.licenseNumber,
      biography: formValues.biography,
      medicalServiceIds: formValues.medicalServiceIds.map(Number),
      isActive: formValues.isActive
    };

    if (!editingItem) {
      payload.password = formValues.password;
    }

    setIsSubmitting(true);

    try {
      if (editingItem) {
        await doctorsApi.update(editingItem.id, payload);
        showSnackbar('Profilo medico aggiornato con successo', 'success');
      } else {
        await doctorsApi.create(payload);
        showSnackbar('Medico creato con successo', 'success');
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
      await doctorsApi.updateStatus(statusDialog.id, !statusDialog.isActive);
      showSnackbar('Stato medico aggiornato', 'success');
      setStatusDialog(null);
      await reload();
    } catch (requestError) {
      showSnackbar(requestError.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvailabilitySubmit = async () => {
    if (!availabilityDialog.doctor) {
      return;
    }

    setIsAvailabilitySubmitting(true);
    setAvailabilityError('');

    const payload = {
      weekday: Number(availabilityFormValues.weekday),
      startTime: availabilityFormValues.startTime,
      endTime: availabilityFormValues.endTime,
      isActive: availabilityFormValues.isActive
    };

    try {
      if (availabilityFormValues.id) {
        await availabilityApi.update(availabilityFormValues.id, payload);
        showSnackbar('Disponibilita aggiornata con successo', 'success');
      } else {
        await availabilityApi.createForDoctor(availabilityDialog.doctor.id, payload);
        showSnackbar('Disponibilita creata con successo', 'success');
      }

      resetAvailabilityForm();
      await loadAvailabilities(availabilityDialog.doctor);
    } catch (requestError) {
      setAvailabilityError(requestError.message);
      showSnackbar(requestError.message, 'error');
    } finally {
      setIsAvailabilitySubmitting(false);
    }
  };

  const handleAvailabilityDelete = async () => {
    if (!availabilityDeleteDialog || !availabilityDialog.doctor) {
      return;
    }

    setIsAvailabilitySubmitting(true);
    setAvailabilityError('');

    try {
      await availabilityApi.remove(availabilityDeleteDialog.id);
      showSnackbar('Disponibilita rimossa con successo', 'success');
      setAvailabilityDeleteDialog(null);
      resetAvailabilityForm();
      await loadAvailabilities(availabilityDialog.doctor);
    } catch (requestError) {
      setAvailabilityError(requestError.message);
      showSnackbar(requestError.message, 'error');
    } finally {
      setIsAvailabilitySubmitting(false);
    }
  };

  const handleAvailabilityEdit = (availability) => {
    setAvailabilityFormValues({
      id: availability.id,
      weekday: String(availability.weekday),
      startTime: availability.startTime.slice(0, 5),
      endTime: availability.endTime.slice(0, 5),
      isActive: availability.isActive
    });
    setAvailabilityError('');
  };

  const columns = useMemo(
    () => [
      {
        field: 'lastName',
        headerName: 'Medico',
        flex: 1.2,
        minWidth: 220,
        valueGetter: (_, row) => `${row.user?.lastName || ''} ${row.user?.firstName || ''}`,
        renderCell: ({ row }) => (
          <Stack spacing={0.25}>
            <Typography variant="subtitle2">
              {row.user?.firstName} {row.user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.user?.email}
            </Typography>
          </Stack>
        )
      },
      {
        field: 'specialtyLabel',
        headerName: 'Specializzazione',
        minWidth: 180,
        sortable: false,
        valueGetter: (_, row) => row.specialty?.name || '-'
      },
      {
        field: 'licenseNumber',
        headerName: 'Licenza',
        minWidth: 170
      },
      {
        field: 'servicesCount',
        headerName: 'Prestazioni',
        minWidth: 140,
        sortable: false,
        valueGetter: (_, row) => row.medicalServices?.length || 0
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
                  key="availabilities"
                  icon={<CalendarMonthOutlinedIcon />}
                  label="Gestisci disponibilita"
                  onClick={() => openAvailabilityDialog(row)}
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
            : [
                <GridActionsCellItem
                  key="availabilities-read"
                  icon={<CalendarMonthOutlinedIcon />}
                  label="Visualizza disponibilita"
                  onClick={() => openAvailabilityDialog(row)}
                  showInMenu
                />
              ]
      }
    ],
    [canManage]
  );

  return (
    <Stack spacing={4}>
      <PageHeader
        eyebrow="Personale medico"
        title="Medici"
        description="Gestione amministrativa dei profili medici, delle specializzazioni primarie e delle prestazioni assegnate."
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
        emptyTitle="Nessun medico trovato"
        emptyDescription="Crea il primo profilo medico oppure amplia i filtri correnti."
        emptyActionLabel={canManage ? 'Nuovo medico' : undefined}
        onEmptyAction={canManage ? handleOpenCreate : undefined}
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
                label="Specializzazione"
                value={draftFilters.specialtyId}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    specialtyId: event.target.value
                  }))
                }
                sx={{ minWidth: { xs: '100%', sm: 240 } }}
              >
                <MenuItem value="all">Tutte le specializzazioni</MenuItem>
                {specialties.map((specialty) => (
                  <MenuItem key={specialty.id} value={String(specialty.id)}>
                    {specialty.name}
                  </MenuItem>
                ))}
              </TextField>
            }
            onSubmit={() =>
              setFilters({
                name: draftFilters.name.trim(),
                specialtyId:
                  draftFilters.specialtyId === 'all' ? undefined : Number(draftFilters.specialtyId),
                isActive: toBooleanFilter(draftFilters.isActive)
              })
            }
            onReset={() => {
              const reset = {
                name: '',
                specialtyId: 'all',
                isActive: 'all'
              };
              setDraftFilters(reset);
              setFilters({
                name: '',
                specialtyId: undefined,
                isActive: undefined
              });
            }}
            actions={
              canManage ? (
                <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={handleOpenCreate}>
                  Nuovo medico
                </Button>
              ) : null
            }
          />
        }
      />

      <FormDialog
        open={dialogOpen}
        title={editingItem ? 'Modifica medico' : 'Nuovo medico'}
        submitLabel={editingItem ? 'Salva modifiche' : 'Crea medico'}
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
              label="License number fittizio"
              value={formValues.licenseNumber}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, licenseNumber: event.target.value }))
              }
              fullWidth
              required
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Biografia"
              value={formValues.biography}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, biography: event.target.value }))
              }
              fullWidth
              multiline
              minRows={3}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Autocomplete
              multiple
              options={medicalServices}
              value={medicalServices.filter((service) =>
                formValues.medicalServiceIds.includes(service.id)
              )}
              onChange={(_, value) =>
                setFormValues((current) => ({
                  ...current,
                  medicalServiceIds: value.map((item) => item.id)
                }))
              }
              getOptionLabel={(option) => option.name}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.name}
                    variant="outlined"
                  />
                ))
              }
              renderInput={(params) => <TextField {...params} label="Prestazioni associate" />}
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
        title={statusDialog?.isActive ? 'Disattivare medico?' : 'Attivare medico?'}
        description={
          statusDialog?.isActive
            ? 'Il medico restera storicamente referenziato ma non sara disponibile come profilo attivo.'
            : 'Il medico tornera disponibile per agende, appuntamenti e associazioni abilitate.'
        }
        confirmLabel={statusDialog?.isActive ? 'Disattiva' : 'Attiva'}
        confirmColor={statusDialog?.isActive ? 'warning' : 'primary'}
        onClose={() => setStatusDialog(null)}
        onConfirm={handleStatusChange}
      />

      <FormDialog
        open={availabilityDialog.open}
        title={
          availabilityDialog.doctor
            ? `Disponibilita di ${availabilityDialog.doctor.user?.firstName || ''} ${availabilityDialog.doctor.user?.lastName || ''}`.trim()
            : 'Disponibilita medico'
        }
        submitLabel={canManage ? (availabilityFormValues.id ? 'Salva disponibilita' : 'Aggiungi disponibilita') : null}
        isSubmitting={isAvailabilitySubmitting}
        maxWidth="md"
        onClose={closeAvailabilityDialog}
        onSubmit={canManage ? handleAvailabilitySubmit : closeAvailabilityDialog}
      >
        <Stack spacing={3} sx={{ mt: 0.5 }}>
          <Alert severity="info">
            Gli slot degli appuntamenti vengono generati automaticamente a partire da queste disponibilita.
          </Alert>

          {availabilityError ? <Alert severity="error">{availabilityError}</Alert> : null}

          {canManage ? (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Giorno"
                  value={availabilityFormValues.weekday}
                  onChange={(event) =>
                    setAvailabilityFormValues((current) => ({
                      ...current,
                      weekday: event.target.value
                    }))
                  }
                  fullWidth
                >
                  {weekdayOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  label="Ora inizio"
                  type="time"
                  value={availabilityFormValues.startTime}
                  onChange={(event) =>
                    setAvailabilityFormValues((current) => ({
                      ...current,
                      startTime: event.target.value
                    }))
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  label="Ora fine"
                  type="time"
                  value={availabilityFormValues.endTime}
                  onChange={(event) =>
                    setAvailabilityFormValues((current) => ({
                      ...current,
                      endTime: event.target.value
                    }))
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Stato"
                  value={String(availabilityFormValues.isActive)}
                  onChange={(event) =>
                    setAvailabilityFormValues((current) => ({
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
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
                  {availabilityFormValues.id ? (
                    <Button variant="text" onClick={resetAvailabilityForm} disabled={isAvailabilitySubmitting}>
                      Nuova disponibilita
                    </Button>
                  ) : null}
                </Stack>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="info">La segreteria puo consultare le disponibilita ma non modificarle.</Alert>
          )}

          {isAvailabilityLoading ? (
            <Typography variant="body2" color="text.secondary">
              Caricamento disponibilita in corso.
            </Typography>
          ) : availabilities.length === 0 ? (
            <Alert severity="warning">Nessuna disponibilita configurata per questo medico.</Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Giorno</TableCell>
                  <TableCell>Inizio</TableCell>
                  <TableCell>Fine</TableCell>
                  <TableCell>Stato</TableCell>
                  {canManage ? <TableCell align="right">Azioni</TableCell> : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {availabilities.map((availability) => (
                  <TableRow key={availability.id} hover>
                    <TableCell>{getWeekdayLabel(availability.weekday)}</TableCell>
                    <TableCell>{availability.startTime.slice(0, 5)}</TableCell>
                    <TableCell>{availability.endTime.slice(0, 5)}</TableCell>
                    <TableCell>
                      <StatusChip status={getStatusValue(availability.isActive)} />
                    </TableCell>
                    {canManage ? (
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            startIcon={<EditCalendarOutlinedIcon />}
                            onClick={() => handleAvailabilityEdit(availability)}
                          >
                            Modifica
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteOutlineOutlinedIcon />}
                            onClick={() => setAvailabilityDeleteDialog(availability)}
                          >
                            Rimuovi
                          </Button>
                        </Stack>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Stack>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(availabilityDeleteDialog)}
        title="Rimuovere disponibilita?"
        description="La disponibilita selezionata verra eliminata. Gli slot futuri verranno ricalcolati in base alle disponibilita rimanenti."
        confirmLabel="Rimuovi"
        confirmColor="error"
        onClose={() => setAvailabilityDeleteDialog(null)}
        onConfirm={handleAvailabilityDelete}
      />
    </Stack>
  );
}
