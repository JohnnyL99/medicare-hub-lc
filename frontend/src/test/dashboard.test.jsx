import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/it';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dashboardApi } from '../api/dashboardApi';
import { doctorsApi } from '../api/doctorsApi';
import { useAuth } from '../hooks/useAuth';
import { DashboardPage } from '../pages/DashboardPage';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('../api/dashboardApi', () => ({
  dashboardApi: {
    getSummary: vi.fn(),
    getAppointmentsTrend: vi.fn(),
    getBySpecialty: vi.fn(),
    getUpcoming: vi.fn()
  }
}));

vi.mock('../api/doctorsApi', () => ({
  doctorsApi: {
    list: vi.fn()
  }
}));

function renderDashboard() {
  return render(
    <MemoryRouter>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
        <DashboardPage />
      </LocalizationProvider>
    </MemoryRouter>
  );
}

describe('frontend dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    doctorsApi.list.mockResolvedValue({
      data: [
        {
          id: 3,
          user: {
            firstName: 'Lucia',
            lastName: 'Bianchi'
          }
        }
      ]
    });

    dashboardApi.getSummary.mockResolvedValue({
      totalAppointments: 24,
      scheduledAppointments: 6,
      confirmedAppointments: 3,
      completedAppointments: 12,
      cancelledAppointments: 3,
      noShowAppointments: 2,
      activePatients: 18,
      theoreticalRevenue: 1480
    });
    dashboardApi.getAppointmentsTrend.mockResolvedValue([
      {
        period: '2026-08-01',
        totalAppointments: 4,
        scheduledAppointments: 1,
        confirmedAppointments: 0,
        completedAppointments: 2,
        cancelledAppointments: 1,
        noShowAppointments: 0,
        theoreticalRevenue: 200
      },
      {
        period: '2026-08-02',
        totalAppointments: 5,
        scheduledAppointments: 1,
        confirmedAppointments: 1,
        completedAppointments: 3,
        cancelledAppointments: 0,
        noShowAppointments: 1,
        theoreticalRevenue: 320
      }
    ]);
    dashboardApi.getBySpecialty.mockResolvedValue([
      {
        specialty: {
          id: 7,
          name: 'Cardiologia'
        },
        totalAppointments: 8,
        completedAppointments: 5,
        theoreticalRevenue: 640
      }
    ]);
    dashboardApi.getUpcoming.mockResolvedValue({
      timezone: 'Europe/Rome',
      items: [
        {
          id: 1,
          scheduledAt: '2026-08-10T08:00:00.000Z',
          status: 'SCHEDULED',
          priceSnapshot: 120,
          patient: {
            firstName: 'Mario',
            lastName: 'Rossi'
          },
          doctor: {
            firstName: 'Lucia',
            lastName: 'Bianchi'
          },
          medicalService: {
            name: 'Visita cardiologica'
          },
          specialty: {
            name: 'Cardiologia'
          }
        }
      ]
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders summary cards and upcoming table using backend dashboard data', async () => {
    useAuth.mockReturnValue({
      user: {
        id: 1,
        role: 'ADMIN'
      }
    });

    renderDashboard();

    expect(await screen.findByText(/cruscotto operativo/i)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /operativa/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /amministrativa e contabile/i })).toBeInTheDocument();
    expect(await screen.findByText('24')).toBeInTheDocument();
    expect(screen.getByText(/visita cardiologica/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /amministrativa e contabile/i }));

    expect(await screen.findByText(/sezione amministrativa e contabile/i)).toBeInTheDocument();
    expect(screen.getByText(/volume prenotazioni nel tempo/i)).toBeInTheDocument();
    expect(screen.getByText(/funnel di conversione appuntamenti/i)).toBeInTheDocument();
    expect(screen.getAllByText(/fatturato teorico/i).length).toBeGreaterThan(0);
    expect(screen.getByText((content) => content.replace(/\s/g, '').includes('1480,00'))).toBeInTheDocument();
    expect(screen.getByText(/50,0%/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(dashboardApi.getSummary).toHaveBeenCalledTimes(1);
      expect(dashboardApi.getAppointmentsTrend).toHaveBeenCalledTimes(1);
      expect(dashboardApi.getBySpecialty).toHaveBeenCalledTimes(1);
      expect(dashboardApi.getUpcoming).toHaveBeenCalledTimes(1);
    });
  });

  it('shows an error state when dashboard requests fail', async () => {
    useAuth.mockReturnValue({
      user: {
        id: 1,
        role: 'ADMIN'
      }
    });
    dashboardApi.getSummary.mockRejectedValue({
      message: 'Errore backend dashboard'
    });

    renderDashboard();

    expect(await screen.findByText(/errore di caricamento/i)).toBeInTheDocument();
    expect(screen.getByText(/errore backend dashboard/i)).toBeInTheDocument();
  });

  it('hides the doctor filter for doctor users', async () => {
    useAuth.mockReturnValue({
      user: {
        id: 6,
        role: 'DOCTOR'
      }
    });

    renderDashboard();

    expect(await screen.findByText(/dati limitati automaticamente al medico autenticato/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^medico$/i)).not.toBeInTheDocument();
  });
});
