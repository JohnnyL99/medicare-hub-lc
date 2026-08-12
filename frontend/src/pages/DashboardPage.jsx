import EuroOutlinedIcon from '@mui/icons-material/EuroOutlined';
import Groups2OutlinedIcon from '@mui/icons-material/Groups2Outlined';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import { BarChart, LineChart } from '@mui/x-charts';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { dashboardApi } from '../api/dashboardApi';
import { doctorsApi } from '../api/doctorsApi';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { useAuth } from '../hooks/useAuth';
import { appConfig } from '../utils/appConfig';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { hasRole } from '../utils/permissions';
import { toApiDate, toDatePickerValue } from './pageHelpers';

function buildTrendGroupBy(dateFrom, dateTo) {
  if (!dateFrom || !dateTo) {
    return 'day';
  }

  const start = dayjs(dateFrom);
  const end = dayjs(dateTo);

  if (!start.isValid() || !end.isValid()) {
    return 'day';
  }

  return end.diff(start, 'day') > 45 ? 'month' : 'day';
}

function toStartOfDayIso(value) {
  return value ? dayjs(value).startOf('day').toISOString() : undefined;
}

function toEndOfDayIso(value) {
  return value ? dayjs(value).endOf('day').toISOString() : undefined;
}

function formatPercentage(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-';
  }

  return `${new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(Number(value))}%`;
}

function calculateRate(part, total) {
  if (!total) {
    return 0;
  }

  return (Number(part) / Number(total)) * 100;
}

function DashboardSummaryCard({ label, value, helperText, icon, status, loading }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">{label}</Typography>
            {status ? <StatusChip status={status} /> : icon}
          </Stack>
          {loading ? <Skeleton variant="text" width="60%" height={48} /> : <Typography variant="h4">{value}</Typography>}
          <Typography variant="body2" color="text.secondary">
            {helperText}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

function DashboardChartCard({ title, description, loading, isEmpty, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
      <Stack spacing={2} sx={{ height: '100%' }}>
        <Stack spacing={0.5}>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Stack>
        <Divider />
        {loading ? (
          <Stack spacing={1.5}>
            <Skeleton variant="rounded" height={260} />
            <Skeleton variant="text" width="45%" />
          </Stack>
        ) : isEmpty ? (
          <EmptyState
            title="Nessun dato disponibile"
            description="L intervallo selezionato non produce ancora dati aggregati per questo widget."
          />
        ) : (
          children
        )}
      </Stack>
    </Paper>
  );
}

function DashboardTabPanel({ value, currentValue, title, description, children }) {
  if (value !== currentValue) {
    return null;
  }

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h5">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Stack>
        <Divider />
        {children}
      </Stack>
    </Paper>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const canChooseDoctor = hasRole(user, ['ADMIN', 'RECEPTIONIST']);
  const [activeTab, setActiveTab] = useState('operational');
  const [filters, setFilters] = useState({
    dateFrom: dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
    dateTo: dayjs().format('YYYY-MM-DD'),
    doctorId: 'all'
  });
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [bySpecialty, setBySpecialty] = useState([]);
  const [upcoming, setUpcoming] = useState({
    timezone: '',
    items: []
  });
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const requestFilters = useMemo(
    () => ({
      dateFrom: toStartOfDayIso(filters.dateFrom),
      dateTo: toEndOfDayIso(filters.dateTo),
      doctorId: canChooseDoctor && filters.doctorId !== 'all' ? Number(filters.doctorId) : undefined
    }),
    [canChooseDoctor, filters.dateFrom, filters.dateTo, filters.doctorId]
  );

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [summaryData, trendData, specialtyData, upcomingData] = await Promise.all([
        dashboardApi.getSummary(requestFilters),
        dashboardApi.getAppointmentsTrend({
          ...requestFilters,
          groupBy: buildTrendGroupBy(filters.dateFrom, filters.dateTo)
        }),
        dashboardApi.getBySpecialty(requestFilters),
        dashboardApi.getUpcoming({
          ...requestFilters,
          limit: 8
        })
      ]);

      setSummary(summaryData);
      setTrend(Array.isArray(trendData) ? trendData : []);
      setBySpecialty(Array.isArray(specialtyData) ? specialtyData : []);
      setUpcoming(upcomingData || { timezone: '', items: [] });
    } catch (requestError) {
      setError(requestError);
      setSummary(null);
      setTrend([]);
      setBySpecialty([]);
      setUpcoming({
        timezone: '',
        items: []
      });
    } finally {
      setLoading(false);
    }
  }, [filters.dateFrom, filters.dateTo, requestFilters]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!canChooseDoctor) {
      return;
    }

    doctorsApi
      .list({
        page: 1,
        pageSize: 100,
        orderBy: 'lastName',
        sortOrder: 'asc',
        isActive: 'true'
      })
      .then((response) => {
        setDoctors(response.data || []);
      })
      .catch(() => {
        setDoctors([]);
      });
  }, [canChooseDoctor]);

  const summaryCards = useMemo(
    () => [
      {
        key: 'totalAppointments',
        label: 'Appuntamenti totali',
        value: summary?.totalAppointments ?? 0,
        helperText: 'Volume complessivo degli appuntamenti nel periodo selezionato.',
        status: 'SCHEDULED'
      },
      {
        key: 'completedAppointments',
        label: 'Appuntamenti completati',
        value: summary?.completedAppointments ?? 0,
        helperText: 'Appuntamenti conclusi e conteggiati dal backend come completati.',
        status: 'COMPLETED'
      },
      {
        key: 'cancelledAppointments',
        label: 'Appuntamenti cancellati',
        value: summary?.cancelledAppointments ?? 0,
        helperText: 'Appuntamenti annullati nel perimetro del filtro attuale.',
        status: 'CANCELLED'
      },
      {
        key: 'activePatients',
        label: 'Pazienti attivi',
        value: summary?.activePatients ?? 0,
        helperText: 'Pazienti attivi coinvolti dagli appuntamenti filtrati.',
        icon: <Groups2OutlinedIcon color="primary" />
      },
      {
        key: 'theoreticalRevenue',
        label: 'Fatturato teorico',
        value: formatCurrency(summary?.theoreticalRevenue ?? 0),
        helperText:
          'Somma teorica dei soli appuntamenti completati. Non rappresenta fatturato fiscale o contabile.',
        icon: <EuroOutlinedIcon color="primary" />
      }
    ],
    [summary]
  );

  const operationalSummaryCards = useMemo(
    () => summaryCards.filter((card) => card.key !== 'theoreticalRevenue'),
    [summaryCards]
  );

  const administrativeSummaryCards = useMemo(
    () => [
      ...summaryCards.filter((card) => card.key === 'theoreticalRevenue'),
      {
        key: 'completionRate',
        label: 'Tasso di completamento',
        value: formatPercentage(calculateRate(summary?.completedAppointments ?? 0, summary?.totalAppointments ?? 0)),
        helperText: 'Quota di appuntamenti completati rispetto al volume totale nel periodo selezionato.',
        status: 'COMPLETED'
      },
      {
        key: 'noShowRate',
        label: 'Tasso di no-show',
        value: formatPercentage(calculateRate(summary?.noShowAppointments ?? 0, summary?.totalAppointments ?? 0)),
        helperText: 'Incidenza degli appuntamenti marcati come no-show sul totale filtrato.',
        status: 'NO_SHOW'
      }
    ],
    [summary, summaryCards]
  );

  const administrativeFunnelRows = useMemo(() => {
    const totalAppointments = summary?.totalAppointments ?? 0;

    return [
      {
        key: 'scheduled',
        label: 'Programmato',
        count: summary?.scheduledAppointments ?? 0,
        color: '#0f766e'
      },
      {
        key: 'confirmed',
        label: 'Confermato',
        count: summary?.confirmedAppointments ?? 0,
        color: '#2563eb'
      },
      {
        key: 'completed',
        label: 'Completato',
        count: summary?.completedAppointments ?? 0,
        color: '#2f855a'
      },
      {
        key: 'cancelled',
        label: 'Cancellato',
        count: summary?.cancelledAppointments ?? 0,
        color: '#c2410c'
      },
      {
        key: 'noShow',
        label: 'No-show',
        count: summary?.noShowAppointments ?? 0,
        color: '#7c2d12'
      }
    ].map((item) => ({
      ...item,
      percentage: calculateRate(item.count, totalAppointments)
    }));
  }, [summary]);

  const isAllEmpty =
    !loading &&
    !error &&
    (summary?.totalAppointments ?? 0) === 0 &&
    trend.length === 0 &&
    bySpecialty.length === 0 &&
    (upcoming.items?.length ?? 0) === 0;

  if (error && !summary) {
    return (
      <Stack spacing={3}>
        <PageHeader
          eyebrow="Dashboard"
          title="Cruscotto operativo"
          description={`Metriche aggregate e andamento di ${appConfig.clinicName}.`}
        />
        <ErrorState
          description={error.message}
          onAction={loadDashboard}
        />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        eyebrow="Dashboard"
        title="Cruscotto operativo"
        description={`Metriche aggregate, trend e prossimi appuntamenti di ${appConfig.clinicName}. Il valore economico viene sempre mostrato come fatturato teorico.`}
      />

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1">Filtri dashboard</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DatePicker
                label="Data da"
                value={toDatePickerValue(filters.dateFrom)}
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    dateFrom: toApiDate(value)
                  }))
                }
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DatePicker
                label="Data a"
                value={toDatePickerValue(filters.dateTo)}
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    dateTo: toApiDate(value)
                  }))
                }
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </Grid>
            {canChooseDoctor ? (
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Medico"
                  value={filters.doctorId}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      doctorId: event.target.value
                    }))
                  }
                >
                  <MenuItem value="all">Tutti i medici</MenuItem>
                  {doctors.map((doctor) => (
                    <MenuItem key={doctor.id} value={String(doctor.id)}>
                      {doctor.user?.firstName} {doctor.user?.lastName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            ) : (
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack justifyContent="center" sx={{ height: '100%' }}>
                  <Chip
                    variant="outlined"
                    color="info"
                    label="Dati limitati automaticamente al medico autenticato"
                  />
                </Stack>
              </Grid>
            )}
          </Grid>
        </Stack>
      </Paper>

      {isAllEmpty ? (
        <EmptyState
          title="Nessun dato disponibile per la dashboard"
          description="Nell intervallo selezionato non ci sono metriche o prossimi appuntamenti da mostrare."
        />
      ) : (
        <>
          <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="Sezioni dashboard"
            >
              <Tab label="Operativa" value="operational" />
              <Tab label="Amministrativa e contabile" value="administrative" />
            </Tabs>
          </Paper>

          <DashboardTabPanel
            value="operational"
            currentValue={activeTab}
            title="Sezione operativa"
            description="Contiene i volumi, l andamento operativo e i prossimi appuntamenti utili alla gestione quotidiana."
          >
            <Grid container spacing={3}>
              {operationalSummaryCards.map((card) => (
                <Grid key={card.key} size={{ xs: 12, sm: 6, lg: 3 }}>
                  <DashboardSummaryCard
                    label={card.label}
                    value={card.value}
                    helperText={card.helperText}
                    icon={card.icon}
                    status={card.status}
                    loading={loading}
                  />
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, xl: 8 }}>
                <DashboardChartCard
                  title="Andamento appuntamenti"
                  description="Trend temporale del numero di appuntamenti e dei completati, aggregato dal backend."
                  loading={loading}
                  isEmpty={trend.length === 0}
                >
                  <LineChart
                    height={320}
                    xAxis={[
                      {
                        scaleType: 'point',
                        data: trend.map((item) => formatDate(item.period))
                      }
                    ]}
                    series={[
                      {
                        id: 'totalAppointments',
                        label: 'Appuntamenti totali',
                        data: trend.map((item) => item.totalAppointments),
                        color: '#0f766e'
                      },
                      {
                        id: 'completedAppointments',
                        label: 'Appuntamenti completati',
                        data: trend.map((item) => item.completedAppointments),
                        color: '#2f855a'
                      }
                    ]}
                    margin={{ left: 60, right: 20, top: 16, bottom: 32 }}
                  />
                </DashboardChartCard>
              </Grid>
              <Grid size={{ xs: 12, xl: 4 }}>
                <DashboardChartCard
                  title="Appuntamenti per specializzazione"
                  description="Confronto operativo per specializzazione sul volume appuntamenti e sugli esiti completati."
                  loading={loading}
                  isEmpty={bySpecialty.length === 0}
                >
                  <BarChart
                    height={320}
                    xAxis={[
                      {
                        scaleType: 'band',
                        data: bySpecialty.map((item) => item.specialty.name)
                      }
                    ]}
                    series={[
                      {
                        data: bySpecialty.map((item) => item.totalAppointments),
                        label: 'Appuntamenti totali',
                        color: '#0f766e'
                      },
                      {
                        data: bySpecialty.map((item) => item.completedAppointments),
                        label: 'Completati',
                        color: '#2f855a'
                      }
                    ]}
                    margin={{ left: 50, right: 20, top: 16, bottom: 80 }}
                  />
                </DashboardChartCard>
              </Grid>
            </Grid>

            <Paper variant="outlined" sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="h6">Prossimi appuntamenti</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Elenco dei prossimi appuntamenti futuri nello scope consentito dal backend.
                    </Typography>
                  </Stack>
                </Stack>
                <Divider />
                {loading ? (
                  <Stack spacing={1.5}>
                    <Skeleton variant="rounded" height={56} />
                    <Skeleton variant="rounded" height={56} />
                    <Skeleton variant="rounded" height={56} />
                  </Stack>
                ) : upcoming.items.length === 0 ? (
                  <EmptyState
                    title="Nessun prossimo appuntamento"
                    description="Non risultano appuntamenti futuri programmati o confermati per i filtri attuali."
                  />
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Data e ora</TableCell>
                        <TableCell>Paziente</TableCell>
                        <TableCell>Medico</TableCell>
                        <TableCell>Prestazione</TableCell>
                        <TableCell>Specializzazione</TableCell>
                        <TableCell>Stato</TableCell>
                        <TableCell align="right">Fatturato teorico</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {upcoming.items.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell>{formatDateTime(item.scheduledAt)}</TableCell>
                          <TableCell>
                            {item.patient.firstName} {item.patient.lastName}
                          </TableCell>
                          <TableCell>
                            {item.doctor.firstName} {item.doctor.lastName}
                          </TableCell>
                          <TableCell>{item.medicalService.name}</TableCell>
                          <TableCell>{item.specialty.name}</TableCell>
                          <TableCell>
                            <StatusChip status={item.status} />
                          </TableCell>
                          <TableCell align="right">{formatCurrency(item.priceSnapshot)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Stack>
            </Paper>
          </DashboardTabPanel>

          <DashboardTabPanel
            value="administrative"
            currentValue={activeTab}
            title="Sezione amministrativa e contabile"
            description="Raccoglie gli indicatori economici teorici e la loro distribuzione, senza rappresentare dati fiscali o contabili ufficiali."
          >
            <Grid container spacing={3}>
              {administrativeSummaryCards.map((card) => (
                <Grid key={card.key} size={{ xs: 12, md: 4 }}>
                  <DashboardSummaryCard
                    label={card.label}
                    value={card.value}
                    helperText={card.helperText}
                    icon={card.icon}
                    status={card.status}
                    loading={loading}
                  />
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 6 }}>
                <DashboardChartCard
                  title="Volume prenotazioni nel tempo"
                  description="Trend del volume complessivo degli appuntamenti filtrati, utile per leggere crescita e stagionalita della domanda."
                  loading={loading}
                  isEmpty={trend.length === 0}
                >
                  <LineChart
                    height={320}
                    xAxis={[
                      {
                        scaleType: 'point',
                        data: trend.map((item) => formatDate(item.period))
                      }
                    ]}
                    series={[
                      {
                        id: 'totalAppointmentsAdministrative',
                        label: 'Prenotazioni',
                        data: trend.map((item) => item.totalAppointments),
                        color: '#0f766e'
                      }
                    ]}
                    margin={{ left: 60, right: 20, top: 16, bottom: 32 }}
                  />
                </DashboardChartCard>
              </Grid>
              <Grid size={{ xs: 12, lg: 6 }}>
                <DashboardChartCard
                  title="Esiti appuntamenti nel tempo"
                  description="Confronta completati, cancellati e no-show per capire la qualita del volume gestito."
                  loading={loading}
                  isEmpty={trend.length === 0}
                >
                  <BarChart
                    height={320}
                    xAxis={[
                      {
                        scaleType: 'band',
                        data: trend.map((item) => formatDate(item.period))
                      }
                    ]}
                    series={[
                      {
                        data: trend.map((item) => item.completedAppointments),
                        label: 'Completati',
                        color: '#2f855a'
                      },
                      {
                        data: trend.map((item) => item.cancelledAppointments),
                        label: 'Cancellati',
                        color: '#c2410c'
                      },
                      {
                        data: trend.map((item) => item.noShowAppointments),
                        label: 'No-show',
                        color: '#7c2d12'
                      }
                    ]}
                    margin={{ left: 60, right: 20, top: 16, bottom: 32 }}
                  />
                </DashboardChartCard>
              </Grid>
              <Grid size={{ xs: 12, lg: 6 }}>
                <DashboardChartCard
                  title="Andamento fatturato teorico"
                  description="Trend del fatturato teorico calcolato dal backend sui soli appuntamenti completati."
                  loading={loading}
                  isEmpty={trend.length === 0}
                >
                  <BarChart
                    height={320}
                    xAxis={[
                      {
                        scaleType: 'band',
                        data: trend.map((item) => formatDate(item.period))
                      }
                    ]}
                    series={[
                      {
                        data: trend.map((item) => item.theoreticalRevenue),
                        label: 'Fatturato teorico',
                        valueFormatter: (value) => formatCurrency(value),
                        color: '#2f6f8f'
                      }
                    ]}
                    margin={{ left: 70, right: 20, top: 16, bottom: 32 }}
                  />
                </DashboardChartCard>
              </Grid>
              <Grid size={{ xs: 12, lg: 6 }}>
                <DashboardChartCard
                  title="Fatturato teorico per specializzazione"
                  description="Valore teorico per specializzazione, senza alcuna interpretazione fiscale o contabile."
                  loading={loading}
                  isEmpty={bySpecialty.length === 0}
                >
                  <BarChart
                    height={320}
                    xAxis={[
                      {
                        scaleType: 'band',
                        data: bySpecialty.map((item) => item.specialty.name)
                      }
                    ]}
                    series={[
                      {
                        data: bySpecialty.map((item) => item.theoreticalRevenue),
                        label: 'Fatturato teorico',
                        valueFormatter: (value) => formatCurrency(value),
                        color: '#2f6f8f'
                      }
                    ]}
                    margin={{ left: 70, right: 20, top: 16, bottom: 80 }}
                  />
                </DashboardChartCard>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <DashboardChartCard
                  title="Funnel di conversione appuntamenti"
                  description="Lettura sintetica del passaggio da programmati a confermati e completati, con evidenza delle perdite per cancellazione e no-show."
                  loading={loading}
                  isEmpty={(summary?.totalAppointments ?? 0) === 0}
                >
                  <Stack spacing={2}>
                    {administrativeFunnelRows.map((row) => (
                      <Stack key={row.key} spacing={0.75}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                          <Typography variant="subtitle2">{row.label}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {row.count} · {formatPercentage(row.percentage)}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box sx={{ flexGrow: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(row.percentage, 100)}
                              sx={{
                                height: 12,
                                borderRadius: 999,
                                backgroundColor: '#e5e7eb',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: row.color,
                                  borderRadius: 999
                                }
                              }}
                            />
                          </Box>
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                </DashboardChartCard>
              </Grid>
            </Grid>
          </DashboardTabPanel>
        </>
      )}
    </Stack>
  );
}
