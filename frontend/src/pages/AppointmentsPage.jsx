import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { appointmentsApi } from '../api/appointmentsApi';
import { doctorsApi } from '../api/doctorsApi';
import { medicalServicesApi } from '../api/medicalServicesApi';
import { patientsApi } from '../api/patientsApi';
import { specialtiesApi } from '../api/specialtiesApi';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EntityToolbar } from '../components/EntityToolbar';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FormDialog } from '../components/FormDialog';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useServerCollection } from '../hooks/useServerCollection';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { hasRole } from '../utils/permissions';
import {
  canEditAppointment,
  getAllowedAppointmentTransitions,
  getAppointmentStatusLabel,
  shouldConfirmAppointmentStatus
} from './appointments.utils';
import { toApiDate, toDatePickerValue } from './pageHelpers';

const todayIsoDate = dayjs().format('YYYY-MM-DD');

const initialFormState = {
  patientId: '',
  doctorId: '',
  medicalServiceId: '',
  date: '',
  slotStartAt: '',
  operationalNotes: ''
};

const appointmentStatusOptions = [
  { value: 'all', label: 'Tutti gli stati' },
  { value: 'SCHEDULED', label: getAppointmentStatusLabel('SCHEDULED') },
  { value: 'CONFIRMED', label: getAppointmentStatusLabel('CONFIRMED') },
  { value: 'COMPLETED', label: getAppointmentStatusLabel('COMPLETED') },
  { value: 'CANCELLED', label: getAppointmentStatusLabel('CANCELLED') },
  { value: 'NO_SHOW', label: getAppointmentStatusLabel('NO_SHOW') }
];

const appointmentPeriodOptions = [
  { value: 'custom', label: 'Intervallo personalizzato' },
  { value: 'today', label: 'Appuntamenti di oggi' },
  { value: 'week', label: 'Appuntamenti settimana' },
  { value: 'month', label: 'Appuntamenti del mese' },
  { value: 'last30days', label: 'Appuntamenti ultimi 30 gg' },
  { value: 'lastQuarter', label: 'Ultimo trimestre' },
  { value: 'last12months', label: 'Ultimi 12 mesi' }
];

function toDateFromIso(value) {
  if (!value) {
    return undefined;
  }

  return dayjs(value).startOf('day').toISOString();
}

function toDateToIso(value) {
  if (!value) {
    return undefined;
  }

  return dayjs(value).endOf('day').toISOString();
}

function getCurrentWeekRange() {
  const now = dayjs();
  const currentWeekday = now.day();
  const diffToMonday = currentWeekday === 0 ? 6 : currentWeekday - 1;
  const start = now.subtract(diffToMonday, 'day');

  return {
    dateFrom: start.format('YYYY-MM-DD'),
    dateTo: start.add(6, 'day').format('YYYY-MM-DD')
  };
}

function getPeriodDates(periodPreset) {
  const now = dayjs();

  switch (periodPreset) {
    case 'today':
      return {
        dateFrom: now.format('YYYY-MM-DD'),
        dateTo: now.format('YYYY-MM-DD')
      };
    case 'week':
      return getCurrentWeekRange();
    case 'month':
      return {
        dateFrom: now.startOf('month').format('YYYY-MM-DD'),
        dateTo: now.endOf('month').format('YYYY-MM-DD')
      };
    case 'last30days':
      return {
        dateFrom: now.subtract(29, 'day').format('YYYY-MM-DD'),
        dateTo: now.format('YYYY-MM-DD')
      };
    case 'lastQuarter':
      return {
        dateFrom: now.subtract(2, 'month').startOf('month').format('YYYY-MM-DD'),
        dateTo: now.endOf('month').format('YYYY-MM-DD')
      };
    case 'last12months':
      return {
        dateFrom: now.subtract(11, 'month').startOf('month').format('YYYY-MM-DD'),
        dateTo: now.endOf('month').format('YYYY-MM-DD')
      };
    default:
      return null;
  }
}

function getInitialDraftFilters(isDoctor) {
  return {
    periodPreset: 'custom',
    dateFrom: isDoctor ? todayIsoDate : '',
    dateTo: '',
    doctorId: 'all',
    patientId: 'all',
    medicalServiceId: 'all',
    specialtyId: 'all',
    status: 'all',
    search: ''
  };
}

function buildFilterPayload(draftFilters, isDoctor) {
  return {
    dateFrom: toDateFromIso(draftFilters.dateFrom || (isDoctor ? todayIsoDate : '')),
    dateTo: toDateToIso(draftFilters.dateTo),
    doctorId: isDoctor || draftFilters.doctorId === 'all' ? undefined : Number(draftFilters.doctorId),
    patientId: draftFilters.patientId === 'all' ? undefined : Number(draftFilters.patientId),
    medicalServiceId:
      draftFilters.medicalServiceId === 'all' ? undefined : Number(draftFilters.medicalServiceId),
    specialtyId:
      draftFilters.specialtyId === 'all' ? undefined : Number(draftFilters.specialtyId),
    status: draftFilters.status === 'all' ? undefined : draftFilters.status,
    search: draftFilters.search.trim()
  };
}

function createSummaryFromService(service, slotsResponse) {
  return {
    durationMinutes:
      slotsResponse?.medicalService?.durationMinutes || service?.durationMinutes || null,
    currentPrice: service?.currentPrice ?? null
  };
}

function getInjectedCurrentSlot(appointment, date, doctorId, medicalServiceId) {
  if (!appointment) {
    return null;
  }

  const isSameDate = dayjs(appointment.scheduledAt).format('YYYY-MM-DD') === date;
  const isSameDoctor = Number(appointment.doctorId) === Number(doctorId);
  const isSameService = Number(appointment.medicalServiceId) === Number(medicalServiceId);

  if (!isSameDate || !isSameDoctor || !isSameService) {
    return null;
  }

  return {
    startAt: appointment.scheduledAt,
    endAt: appointment.endAt,
    startTime: dayjs(appointment.scheduledAt).format('HH:mm'),
    endTime: dayjs(appointment.endAt).format('HH:mm')
  };
}

function createDoctorLookupsFromAppointments(services) {
  const specialtyMap = new Map();

  for (const service of services) {
    if (service.specialty?.id) {
      specialtyMap.set(service.specialty.id, service.specialty);
    }
  }

  return Array.from(specialtyMap.values());
}

export function AppointmentsPage() {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const isDoctor = hasRole(user, ['DOCTOR']);
  const canSchedule = hasRole(user, ['ADMIN', 'RECEPTIONIST']);
  const [draftFilters, setDraftFilters] = useState(() => getInitialDraftFilters(isDoctor));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [formValues, setFormValues] = useState(initialFormState);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [doctorServices, setDoctorServices] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [summary, setSummary] = useState({
    durationMinutes: null,
    currentPrice: null
  });
  const [statusDialog, setStatusDialog] = useState(null);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const hasInitializedAutoFilters = useRef(false);

  const {
    rows,
    meta,
    loading,
    error,
    filters,
    sortModel,
    paginationModel,
    setSortModel,
    setPaginationModel,
    setFilters,
    updateRowById,
    reload
  } = useServerCollection({
    fetcher: appointmentsApi.list,
    initialFilters: buildFilterPayload(getInitialDraftFilters(isDoctor), isDoctor),
    defaultSort: {
      field: 'scheduledAt',
      direction: 'asc'
    },
    sortFieldParam: 'sortBy',
    sortDirectionParam: 'sortDirection'
  });

  const loadLookups = useCallback(async () => {
    try {
      const patientPromise = patientsApi.list({
        page: 1,
        pageSize: 100,
        orderBy: 'lastName',
        sortOrder: 'asc'
      });
      const medicalServicesPromise = medicalServicesApi.list({
        page: 1,
        pageSize: 100,
        orderBy: 'name',
        sortOrder: 'asc'
      });
      const doctorPromise = isDoctor
        ? Promise.resolve({ data: [] })
        : doctorsApi.list({
            page: 1,
            pageSize: 100,
            orderBy: 'lastName',
            sortOrder: 'asc'
          });
      const specialtyPromise = isDoctor
        ? Promise.resolve({ data: [] })
        : specialtiesApi.list({
            page: 1,
            pageSize: 100,
            orderBy: 'name',
            sortOrder: 'asc'
          });

      const [patientResponse, doctorResponse, medicalServicesResponse, specialtyResponse] =
        await Promise.all([
          patientPromise,
          doctorPromise,
          medicalServicesPromise,
          specialtyPromise
        ]);

      setPatients(patientResponse.data);
      setDoctors(doctorResponse.data || []);
      setServices(medicalServicesResponse.data || []);
      setSpecialties(
        isDoctor
          ? createDoctorLookupsFromAppointments(medicalServicesResponse.data || [])
          : specialtyResponse.data || []
      );
    } catch (requestError) {
      showSnackbar(requestError.message, 'error');
    }
  }, [isDoctor, showSnackbar]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  const selectedDoctorService = useMemo(
    () =>
      doctorServices.find((service) => Number(service.id) === Number(formValues.medicalServiceId)) ||
      services.find((service) => Number(service.id) === Number(formValues.medicalServiceId)) ||
      null,
    [doctorServices, formValues.medicalServiceId, services]
  );

  const resetDialogState = useCallback(() => {
    setDialogOpen(false);
    setEditingAppointment(null);
    setFormValues(initialFormState);
    setDoctorServices([]);
    setAvailableSlots([]);
    setSummary({
      durationMinutes: null,
      currentPrice: null
    });
    setFormError('');
  }, []);

  const loadDoctorServices = useCallback(
    async (doctorId, appointment = null) => {
      if (!doctorId) {
        setDoctorServices([]);
        setSummary({
          durationMinutes: null,
          currentPrice: null
        });
        return;
      }

      try {
        const doctor = await doctorsApi.getById(doctorId);
        const medicalServices = Array.isArray(doctor.medicalServices) ? doctor.medicalServices : [];
        const serviceMap = new Map(medicalServices.map((service) => [service.id, service]));

        if (appointment?.medicalService?.id && !serviceMap.has(appointment.medicalService.id)) {
          serviceMap.set(appointment.medicalService.id, {
            id: appointment.medicalService.id,
            name: appointment.medicalService.name,
            currentPrice: appointment.priceSnapshot,
            durationMinutes: appointment.durationMinutesSnapshot,
            isActive: appointment.medicalService.isActive
          });
        }

        const nextServices = Array.from(serviceMap.values());
        setDoctorServices(nextServices);

        if (appointment?.medicalServiceId) {
          const service = nextServices.find(
            (item) => Number(item.id) === Number(appointment.medicalServiceId)
          );

          setSummary(
            createSummaryFromService(service || appointment.medicalService, {
              medicalService: {
                durationMinutes:
                  appointment.durationMinutesSnapshot || appointment.medicalService?.durationMinutes
              }
            })
          );
        }
      } catch (requestError) {
        setDoctorServices([]);
        setFormError(requestError.message);
      }
    },
    []
  );

  const loadAvailableSlots = useCallback(
    async ({ doctorId, medicalServiceId, date, appointment = null }) => {
      if (!doctorId || !medicalServiceId || !date) {
        setFormError('Seleziona medico, prestazione e data prima di cercare gli slot.');
        return;
      }

      setIsLoadingSlots(true);
      setFormError('');

      try {
        const response = await doctorsApi.getAvailableSlots(doctorId, {
          date,
          medicalServiceId
        });
        const currentSlot = getInjectedCurrentSlot(appointment, date, doctorId, medicalServiceId);
        const slotMap = new Map((response.slots || []).map((slot) => [slot.startAt, slot]));

        if (currentSlot) {
          slotMap.set(currentSlot.startAt, currentSlot);
        }

        setAvailableSlots(Array.from(slotMap.values()).sort((left, right) => left.startAt.localeCompare(right.startAt)));
        setSummary(createSummaryFromService(selectedDoctorService, response));
      } catch (requestError) {
        setAvailableSlots([]);
        setSummary(createSummaryFromService(selectedDoctorService, null));
        setFormError(requestError.message);
      } finally {
        setIsLoadingSlots(false);
      }
    },
    [selectedDoctorService]
  );

  const openCreateDialog = () => {
    setEditingAppointment(null);
    setFormValues(initialFormState);
    setDoctorServices([]);
    setAvailableSlots([]);
    setSummary({
      durationMinutes: null,
      currentPrice: null
    });
    setFormError('');
    setDialogOpen(true);
  };

  const openEditDialog = async (appointment) => {
    if (!canEditAppointment(appointment.status)) {
      showSnackbar('Un appuntamento completato non puo piu essere modificato', 'warning');
      return;
    }

    setEditingAppointment(appointment);
    setFormValues({
      patientId: String(appointment.patientId),
      doctorId: String(appointment.doctorId),
      medicalServiceId: String(appointment.medicalServiceId),
      date: dayjs(appointment.scheduledAt).format('YYYY-MM-DD'),
      slotStartAt: appointment.scheduledAt,
      operationalNotes: appointment.operationalNotes || ''
    });
    setSummary({
      durationMinutes: appointment.durationMinutesSnapshot,
      currentPrice: appointment.priceSnapshot
    });
    setDialogOpen(true);

    if (isDoctor) {
      return;
    }

    await loadDoctorServices(appointment.doctorId, appointment);
    await loadAvailableSlots({
      doctorId: appointment.doctorId,
      medicalServiceId: appointment.medicalServiceId,
      date: dayjs(appointment.scheduledAt).format('YYYY-MM-DD'),
      appointment
    });
  };

  const handleDoctorChange = async (value) => {
    setFormValues((current) => ({
      ...current,
      doctorId: value,
      medicalServiceId: '',
      slotStartAt: '',
      date: ''
    }));
    setAvailableSlots([]);
    setDoctorServices([]);
    setSummary({
      durationMinutes: null,
      currentPrice: null
    });
    setFormError('');

    if (value) {
      await loadDoctorServices(Number(value), editingAppointment);
    }
  };

  const handleMedicalServiceChange = (value) => {
    setFormValues((current) => ({
      ...current,
      medicalServiceId: value,
      date: '',
      slotStartAt: ''
    }));
    setAvailableSlots([]);
    const service = doctorServices.find((item) => Number(item.id) === Number(value));
    setSummary(createSummaryFromService(service, null));
    setFormError('');
  };

  useEffect(() => {
    if (isDoctor || !dialogOpen) {
      return;
    }

    if (!formValues.doctorId || !formValues.medicalServiceId || !formValues.date) {
      return;
    }

    loadAvailableSlots({
      doctorId: Number(formValues.doctorId),
      medicalServiceId: Number(formValues.medicalServiceId),
      date: formValues.date,
      appointment: editingAppointment
    });
  }, [
    dialogOpen,
    editingAppointment,
    formValues.date,
    formValues.doctorId,
    formValues.medicalServiceId,
    isDoctor,
    loadAvailableSlots
  ]);

  const executeAppointmentSubmit = async () => {
    const payload = isDoctor
      ? {
          operationalNotes: formValues.operationalNotes
        }
      : {
          patientId: Number(formValues.patientId),
          doctorId: Number(formValues.doctorId),
          medicalServiceId: Number(formValues.medicalServiceId),
          scheduledAt: formValues.slotStartAt,
          operationalNotes: formValues.operationalNotes || null
        };

    setIsSubmitting(true);

    try {
      if (editingAppointment) {
        await appointmentsApi.update(editingAppointment.id, payload);
        showSnackbar(
          isDoctor ? 'Note operative aggiornate con successo' : 'Appuntamento aggiornato con successo',
          'success'
        );
      } else {
        await appointmentsApi.create(payload);
        showSnackbar('Appuntamento creato con successo', 'success');
      }

      resetDialogState();
      await reload();
    } catch (requestError) {
      setFormError(requestError.message);
      showSnackbar(requestError.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogSubmit = async () => {
    if (isDoctor) {
      await executeAppointmentSubmit();
      return;
    }

    if (!formValues.slotStartAt) {
      setFormError('Seleziona uno slot disponibile prima della conferma.');
      return;
    }

    if (editingAppointment) {
      setRescheduleDialogOpen(true);
      return;
    }

    await executeAppointmentSubmit();
  };

  const handleStatusUpdate = useCallback(
    async (appointment, nextStatus) => {
      try {
        const updatedAppointment = await appointmentsApi.updateStatus(appointment.id, nextStatus);
        const nextRow = {
          ...appointment,
          ...updatedAppointment,
          status: updatedAppointment?.status || nextStatus
        };

        showSnackbar(
          `Stato appuntamento aggiornato in ${getAppointmentStatusLabel(nextStatus)}`,
          'success'
        );
        setStatusDialog(null);

        if (filters.status && filters.status !== nextRow.status) {
          await reload();
          return;
        }

        updateRowById(appointment.id, nextRow);
        setSelectedAppointmentId(appointment.id);
      } catch (requestError) {
        showSnackbar(requestError.message, 'error');
      }
    },
    [filters.status, reload, showSnackbar, updateRowById]
  );

  const statusColumnsActions = useMemo(
    () => (appointment) => {
      const items = [];

      if (canEditAppointment(appointment.status)) {
        items.push(
          <GridActionsCellItem
            key="edit"
            icon={<EditOutlinedIcon />}
            label={isDoctor ? 'Aggiorna note' : 'Modifica'}
            onClick={() => openEditDialog(appointment)}
            showInMenu
          />
        );
      }

      for (const nextStatus of getAllowedAppointmentTransitions(appointment.status, user.role)) {
        items.push(
          <GridActionsCellItem
            key={`status-${nextStatus}`}
            icon={<CheckCircleOutlineOutlinedIcon />}
            label={`Imposta ${getAppointmentStatusLabel(nextStatus)}`}
            onClick={() => {
              if (shouldConfirmAppointmentStatus(nextStatus)) {
                setStatusDialog({
                  appointment,
                  nextStatus
                });
                return;
              }

              handleStatusUpdate(appointment, nextStatus);
            }}
            showInMenu
          />
        );
      }

      return items;
    },
    [isDoctor, user.role]
  );

  const columns = useMemo(
    () => [
      {
        field: 'scheduledAt',
        headerName: 'Data e ora',
        minWidth: 185,
        flex: 0.95,
        valueFormatter: (value) => formatDateTime(value)
      },
      {
        field: 'patientLastName',
        headerName: 'Paziente',
        minWidth: 190,
        flex: 0.9,
        sortable: true,
        renderCell: ({ row }) => `${row.patient?.firstName || ''} ${row.patient?.lastName || ''}`
      },
      {
        field: 'doctorLastName',
        headerName: 'Medico',
        minWidth: 190,
        flex: 0.9,
        sortable: !isDoctor,
        hideable: !isDoctor,
        renderCell: ({ row }) =>
          row.doctor?.user ? `${row.doctor.user.firstName} ${row.doctor.user.lastName}` : '-'
      },
      {
        field: 'status',
        headerName: 'Stato',
        minWidth: 150,
        renderCell: ({ row }) => <StatusChip status={row.status} />
      },
      {
        field: 'priceSnapshot',
        headerName: 'Prezzo',
        minWidth: 120,
        valueFormatter: (value) => formatCurrency(value)
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Azioni',
        minWidth: 110,
        getActions: ({ row }) => statusColumnsActions(row)
      }
    ],
    [isDoctor, statusColumnsActions]
  );

  useEffect(() => {
    if (!rows.length) {
      setSelectedAppointmentId(null);
      return;
    }

    const selectedStillPresent = rows.some((row) => row.id === selectedAppointmentId);

    if (!selectedStillPresent) {
      setSelectedAppointmentId(rows[0].id);
    }
  }, [rows, selectedAppointmentId]);

  const selectedAppointment = useMemo(
    () => rows.find((row) => row.id === selectedAppointmentId) || null,
    [rows, selectedAppointmentId]
  );

  useEffect(() => {
    if (!hasInitializedAutoFilters.current) {
      hasInitializedAutoFilters.current = true;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFilters(buildFilterPayload(draftFilters, isDoctor));
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [draftFilters, isDoctor, setFilters]);

  const handlePeriodPresetChange = (periodPreset) => {
    setDraftFilters((current) => {
      const nextRange = getPeriodDates(periodPreset);

      if (!nextRange) {
        return {
          ...current,
          periodPreset
        };
      }

      return {
        ...current,
        periodPreset,
        dateFrom: nextRange.dateFrom,
        dateTo: nextRange.dateTo
      };
    });
  };

  const toolbar = (
    <EntityToolbar
      searchLabel="Ricerca libera"
      searchValue={draftFilters.search}
      onSearchChange={(value) => setDraftFilters((current) => ({ ...current, search: value }))}
      statusValue={draftFilters.status}
      onStatusChange={(value) => setDraftFilters((current) => ({ ...current, status: value }))}
      statusOptions={appointmentStatusOptions}
      extraFilters={
        <>
          <TextField
            select
            label="Periodo"
            value={draftFilters.periodPreset}
            onChange={(event) => handlePeriodPresetChange(event.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 240 } }}
          >
            {appointmentPeriodOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          {!isDoctor ? (
            <DatePicker
              label="Da"
              value={toDatePickerValue(draftFilters.dateFrom)}
              onChange={(value) =>
                setDraftFilters((current) => ({
                  ...current,
                  periodPreset: 'custom',
                  dateFrom: toApiDate(value)
                }))
              }
              slotProps={{
                textField: {
                  sx: { minWidth: { xs: '100%', sm: 180 } }
                }
              }}
            />
          ) : null}
          <DatePicker
            label={isDoctor ? 'Fino al' : 'A'}
            value={toDatePickerValue(draftFilters.dateTo)}
            onChange={(value) =>
              setDraftFilters((current) => ({
                ...current,
                periodPreset: 'custom',
                dateTo: toApiDate(value)
              }))
            }
            slotProps={{
              textField: {
                sx: { minWidth: { xs: '100%', sm: 180 } }
              }
            }}
          />
          {!isDoctor ? (
            <TextField
              select
              label="Medico"
              value={draftFilters.doctorId}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, doctorId: event.target.value }))
              }
              sx={{ minWidth: { xs: '100%', sm: 220 } }}
            >
              <MenuItem value="all">Tutti i medici</MenuItem>
              {doctors.map((doctor) => (
                <MenuItem key={doctor.id} value={String(doctor.id)}>
                  {doctor.user?.firstName} {doctor.user?.lastName}
                </MenuItem>
              ))}
            </TextField>
          ) : null}
          <TextField
            select
            label="Paziente"
            value={draftFilters.patientId}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, patientId: event.target.value }))
            }
            sx={{ minWidth: { xs: '100%', sm: 220 } }}
          >
            <MenuItem value="all">Tutti i pazienti</MenuItem>
            {patients.map((patient) => (
              <MenuItem key={patient.id} value={String(patient.id)}>
                {patient.firstName} {patient.lastName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Prestazione"
            value={draftFilters.medicalServiceId}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                medicalServiceId: event.target.value
              }))
            }
            sx={{ minWidth: { xs: '100%', sm: 220 } }}
          >
            <MenuItem value="all">Tutte le prestazioni</MenuItem>
            {services.map((service) => (
              <MenuItem key={service.id} value={String(service.id)}>
                {service.name}
              </MenuItem>
            ))}
          </TextField>
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
            sx={{ minWidth: { xs: '100%', sm: 220 } }}
          >
            <MenuItem value="all">Tutte le specializzazioni</MenuItem>
            {specialties.map((specialty) => (
              <MenuItem key={specialty.id} value={String(specialty.id)}>
                {specialty.name}
              </MenuItem>
            ))}
          </TextField>
        </>
      }
      onReset={() => {
        const reset = getInitialDraftFilters(isDoctor);
        setDraftFilters(reset);
      }}
      actions={
        isDoctor ? (
          <Chip
            color="info"
            icon={<InfoOutlinedIcon />}
            label="Vista limitata ad agenda personale da oggi in avanti"
            variant="outlined"
          />
        ) : null
      }
    />
  );

  return (
    <Stack spacing={4}>
      <PageHeader
        eyebrow="Agenda"
        title="Appuntamenti"
        description={
          isDoctor
            ? 'Agenda personale del medico con appuntamenti odierni e futuri, aggiornamento stato e note operative.'
            : 'Vista operativa degli appuntamenti con filtri avanzati, scheduling e riprogrammazione controllata.'
        }
        actions={
          canSchedule ? (
            <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={openCreateDialog}>
              Nuovo appuntamento
            </Button>
          ) : null
        }
      />

      {loading && rows.length === 0 ? (
        <LoadingState description="Recupero degli appuntamenti dal backend in corso." />
      ) : error && rows.length === 0 ? (
        <Stack spacing={3}>
          {toolbar}
          <ErrorState description={error.message} onAction={reload} />
        </Stack>
      ) : !loading && rows.length === 0 ? (
        <Stack spacing={3}>
          {toolbar}
          <EmptyState
            title="Nessun appuntamento trovato"
            description="Aggiorna i filtri applicati oppure crea un nuovo appuntamento usando le disponibilita del medico."
            actionLabel={canSchedule ? 'Nuovo appuntamento' : undefined}
            onAction={canSchedule ? openCreateDialog : undefined}
          />
        </Stack>
      ) : (
        <Stack spacing={3}>
          {toolbar}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, xl: 8 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    {error ? <Alert severity="warning">{error.message}</Alert> : null}
                    <DataGrid
                      autoHeight
                      rows={rows}
                      columns={columns}
                      loading={loading}
                      pagination
                      paginationMode="server"
                      sortingMode="server"
                      rowCount={meta.totalItems}
                      paginationModel={paginationModel}
                      onPaginationModelChange={setPaginationModel}
                      sortModel={sortModel}
                      onSortModelChange={setSortModel}
                      disableRowSelectionOnClick
                      rowSelectionModel={{ type: 'include', ids: new Set(selectedAppointmentId ? [selectedAppointmentId] : []) }}
                      onRowSelectionModelChange={(model) => {
                        const nextSelectedId = model.ids?.values?.().next?.().value;

                        if (nextSelectedId) {
                          setSelectedAppointmentId(nextSelectedId);
                        }
                      }}
                      pageSizeOptions={[10, 20, 50]}
                      onRowClick={(params) => setSelectedAppointmentId(params.row.id)}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, xl: 4 }}>
              <Card
                variant="outlined"
                sx={{
                  position: { xl: 'sticky' },
                  top: { xl: 24 },
                  alignSelf: 'flex-start'
                }}
              >
                <CardContent>
                  <Stack spacing={2}>
                    <Stack spacing={0.5}>
                      <Typography variant="h6">Dettaglio appuntamento</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Seleziona una riga nella tabella per visualizzare il riepilogo completo.
                      </Typography>
                    </Stack>
                    <Divider />
                    {selectedAppointment ? (
                      <Stack spacing={1.5}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle1">
                            {selectedAppointment.patient?.firstName} {selectedAppointment.patient?.lastName}
                          </Typography>
                          <StatusChip status={selectedAppointment.status} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          Data e ora: {formatDateTime(selectedAppointment.scheduledAt)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Fine prevista: {formatDateTime(selectedAppointment.endAt)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Medico: {selectedAppointment.doctor?.user?.firstName} {selectedAppointment.doctor?.user?.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Prestazione: {selectedAppointment.medicalService?.name || '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Specializzazione:{' '}
                          {selectedAppointment.medicalService?.specialty?.name ||
                            selectedAppointment.doctor?.specialty?.name ||
                            '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Durata storica: {selectedAppointment.durationMinutesSnapshot || '-'} minuti
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Prezzo storico: {formatCurrency(selectedAppointment.priceSnapshot)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Creato da:{' '}
                          {selectedAppointment.creator
                            ? `${selectedAppointment.creator.firstName} ${selectedAppointment.creator.lastName}`
                            : '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ultimo aggiornamento: {formatDateTime(selectedAppointment.updatedAt)}
                        </Typography>
                        <Divider />
                        <Stack spacing={0.5}>
                          <Typography variant="subtitle2">Note operative</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedAppointment.operationalNotes || 'Nessuna nota operativa.'}
                          </Typography>
                        </Stack>
                      </Stack>
                    ) : (
                      <EmptyState
                        title="Nessun appuntamento selezionato"
                        description="Seleziona un appuntamento dalla tabella per vedere prestazione, specializzazione e note operative."
                      />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      )}

      <FormDialog
        open={dialogOpen}
        title={
          editingAppointment
            ? isDoctor
              ? 'Aggiorna note operative'
              : 'Riprogramma appuntamento'
            : 'Nuovo appuntamento'
        }
        submitLabel={
          editingAppointment
            ? isDoctor
              ? 'Salva note'
              : 'Salva riprogrammazione'
            : 'Conferma appuntamento'
        }
        isSubmitting={isSubmitting}
        maxWidth="md"
        onClose={resetDialogState}
        onSubmit={handleDialogSubmit}
      >
        <Stack spacing={3} sx={{ mt: 0.5 }}>
          {editingAppointment && !isDoctor ? (
            <Alert severity="warning" icon={<InfoOutlinedIcon fontSize="inherit" />}>
              Prima del salvataggio verrà chiesta una conferma esplicita per la riprogrammazione.
            </Alert>
          ) : null}

          {formError ? <Alert severity="error">{formError}</Alert> : null}

          {isDoctor ? (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Paziente"
                  value={
                    editingAppointment?.patient
                      ? `${editingAppointment.patient.firstName} ${editingAppointment.patient.lastName}`
                      : ''
                  }
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Prestazione"
                  value={editingAppointment?.medicalService?.name || ''}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Note operative"
                  value={formValues.operationalNotes}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      operationalNotes: event.target.value
                    }))
                  }
                  fullWidth
                  multiline
                  minRows={4}
                />
              </Grid>
            </Grid>
          ) : (
            <>
              <Alert severity="info" icon={<InfoOutlinedIcon fontSize="inherit" />}>
                Seleziona medico, prestazione e data. Gli slot vengono caricati automaticamente e
                puoi scegliere solo quelli effettivamente disponibili.
              </Alert>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    label="Paziente"
                    value={formValues.patientId}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        patientId: event.target.value
                      }))
                    }
                    fullWidth
                    required
                  >
                    {patients.map((patient) => (
                      <MenuItem key={patient.id} value={String(patient.id)}>
                        {patient.firstName} {patient.lastName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    label="Medico"
                    value={formValues.doctorId}
                    onChange={(event) => handleDoctorChange(event.target.value)}
                    fullWidth
                    required
                  >
                    {doctors.map((doctor) => (
                      <MenuItem key={doctor.id} value={String(doctor.id)}>
                        {doctor.user?.firstName} {doctor.user?.lastName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    label="Prestazione offerta"
                    value={formValues.medicalServiceId}
                    onChange={(event) => handleMedicalServiceChange(event.target.value)}
                    fullWidth
                    required
                    disabled={!formValues.doctorId}
                  >
                    {doctorServices.map((service) => (
                      <MenuItem key={service.id} value={String(service.id)}>
                        {service.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <DatePicker
                    label="Data appuntamento"
                    value={toDatePickerValue(formValues.date)}
                    onChange={(value) =>
                      setFormValues((current) => ({
                        ...current,
                        date: toApiDate(value),
                        slotStartAt: ''
                      }))
                    }
                    minDate={dayjs(todayIsoDate)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        inputProps: {
                          'data-testid': 'appointment-date-input'
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshOutlinedIcon />}
                      onClick={() =>
                        loadAvailableSlots({
                          doctorId: Number(formValues.doctorId),
                          medicalServiceId: Number(formValues.medicalServiceId),
                          date: formValues.date,
                          appointment: editingAppointment
                        })
                      }
                      disabled={
                        isLoadingSlots ||
                        !formValues.doctorId ||
                        !formValues.medicalServiceId ||
                        !formValues.date
                      }
                    >
                      {editingAppointment ? 'Ricarica slot disponibili' : 'Carica slot disponibili'}
                    </Button>
                    <Chip
                      label={
                        isLoadingSlots
                          ? 'Caricamento slot in corso'
                          : availableSlots.length
                            ? `${availableSlots.length} slot disponibili`
                            : 'Nessuno slot disponibile'
                      }
                      color={availableSlots.length ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Slot disponibili</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Gli slot sono calcolati dal backend in base a disponibilita settimanale,
                      sovrapposizioni e durata della prestazione.
                    </Typography>
                    {availableSlots.length ? (
                      <ToggleButtonGroup
                        value={formValues.slotStartAt}
                        exclusive
                        onChange={(_, value) => {
                          if (!value) {
                            return;
                          }

                          setFormValues((current) => ({
                            ...current,
                            slotStartAt: value
                          }));
                        }}
                        aria-label="Slot disponibili"
                        sx={{ flexWrap: 'wrap', gap: 1 }}
                      >
                        {availableSlots.map((slot) => (
                          <ToggleButton key={slot.startAt} value={slot.startAt}>
                            {slot.startTime} - {slot.endTime}
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                    ) : (
                      <Alert severity={isLoadingSlots ? 'info' : 'warning'}>
                        {isLoadingSlots
                          ? 'Sto cercando gli slot disponibili.'
                          : 'Nessuno slot disponibile per la combinazione selezionata. Prova una data diversa o un altra prestazione.'}
                      </Alert>
                    )}
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Note operative"
                    value={formValues.operationalNotes}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        operationalNotes: event.target.value
                      }))
                    }
                    fullWidth
                    multiline
                    minRows={4}
                  />
                </Grid>
              </Grid>

              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle1">Riepilogo appuntamento</Typography>
                    <Divider />
                    <Typography variant="body2" color="text.secondary">
                      Durata prevista: {summary.durationMinutes ? `${summary.durationMinutes} minuti` : '-'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Prezzo corrente di riferimento: {formatCurrency(summary.currentPrice)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Orario selezionato:{' '}
                      {formValues.slotStartAt ? formatDateTime(formValues.slotStartAt) : '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Durata e prezzo non vengono inviati manualmente: saranno ricalcolati e salvati dal backend.
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </>
          )}
        </Stack>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(statusDialog)}
        title={`Confermare stato ${getAppointmentStatusLabel(statusDialog?.nextStatus)}?`}
        description="L'operazione segue le transizioni supportate dal backend e aggiornerà lo stato dell'appuntamento selezionato."
        confirmLabel="Conferma stato"
        confirmColor={
          statusDialog?.nextStatus === 'CANCELLED'
            ? 'warning'
            : statusDialog?.nextStatus === 'COMPLETED'
              ? 'success'
              : 'primary'
        }
        onClose={() => setStatusDialog(null)}
        onConfirm={async () => {
          if (!statusDialog) {
            return;
          }

          await handleStatusUpdate(statusDialog.appointment, statusDialog.nextStatus);
        }}
      />

      <ConfirmDialog
        open={rescheduleDialogOpen}
        title="Confermare la riprogrammazione?"
        description="Il salvataggio verificherà di nuovo disponibilità, sovrapposizioni e regole applicative sul backend."
        confirmLabel="Salva riprogrammazione"
        onClose={() => setRescheduleDialogOpen(false)}
        onConfirm={async () => {
          setRescheduleDialogOpen(false);
          await executeAppointmentSubmit();
        }}
      />
    </Stack>
  );
}
