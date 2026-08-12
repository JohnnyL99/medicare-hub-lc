import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/it';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '../api/authApi';
import { configureApiClient, normalizeApiError } from '../api/apiClient';
import { dashboardApi } from '../api/dashboardApi';
import { doctorsApi } from '../api/doctorsApi';
import { SnackbarProvider } from '../contexts/SnackbarContext';
import { AuthProvider } from '../contexts/AuthContext';
import { AppRoutes } from '../routes/AppRouter';

vi.mock('../api/authApi', () => ({
  authApi: {
    login: vi.fn(),
    getProfile: vi.fn()
  }
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
    list: vi.fn(),
    getCurrent: vi.fn(),
    listAvailableForCurrent: vi.fn(),
    replaceCurrentServices: vi.fn()
  }
}));

function renderApp(initialEntries = ['/dashboard']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
        <SnackbarProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </SnackbarProvider>
      </LocalizationProvider>
    </MemoryRouter>
  );
}

describe('frontend auth', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
    configureApiClient({ getToken: () => null, onUnauthorized: () => {} });
    dashboardApi.getSummary.mockResolvedValue({
      totalAppointments: 0,
      scheduledAppointments: 0,
      confirmedAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      noShowAppointments: 0,
      activePatients: 0,
      theoreticalRevenue: 0
    });
    dashboardApi.getAppointmentsTrend.mockResolvedValue([]);
    dashboardApi.getBySpecialty.mockResolvedValue([]);
    dashboardApi.getUpcoming.mockResolvedValue({
      timezone: 'Europe/Rome',
      items: []
    });
    doctorsApi.list.mockResolvedValue({
      data: []
    });
    doctorsApi.getCurrent.mockResolvedValue({
      id: 6,
      specialty: {
        id: 1,
        name: 'Cardiologia'
      },
      licenseNumber: 'AUR-MED-006',
      medicalServices: []
    });
    doctorsApi.listAvailableForCurrent.mockResolvedValue([]);
    doctorsApi.replaceCurrentServices.mockResolvedValue({
      id: 6,
      medicalServices: []
    });
  });

  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it('redirects unauthenticated users to login', async () => {
    authApi.getProfile.mockRejectedValue({
      isApiError: true,
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Token non valido'
    });

    renderApp(['/dashboard']);

    expect(await screen.findByRole('heading', { name: /medicare hub/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('logs in and persists session data in sessionStorage', async () => {
    authApi.login.mockResolvedValue({
      token: 'jwt-demo-token',
      user: {
        id: 1,
        firstName: 'Aurora',
        lastName: 'Admin',
        email: 'admin@aurora.test',
        role: 'ADMIN'
      }
    });

    renderApp(['/login']);

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'admin@aurora.test' }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Demo123!' }
    });
    fireEvent.click(screen.getByRole('button', { name: /accedi/i }));

    await waitFor(() => {
      expect(sessionStorage.getItem('medicareHub.accessToken')).toBe('jwt-demo-token');
    });
    expect(authApi.login).toHaveBeenCalledTimes(1);
  });

  it('blocks protected admin-only route for receptionist via role route', async () => {
    sessionStorage.setItem('medicareHub.accessToken', 'token');
    sessionStorage.setItem(
      'medicareHub.user',
      JSON.stringify({
        id: 2,
        firstName: 'Giulia',
        lastName: 'Rossi',
        email: 'reception1@aurora.test',
        role: 'RECEPTIONIST'
      })
    );
    authApi.getProfile.mockResolvedValue({
      id: 2,
      firstName: 'Giulia',
      lastName: 'Rossi',
      email: 'reception1@aurora.test',
      role: 'RECEPTIONIST'
    });

    renderApp(['/users']);

    expect(await screen.findByText(/accesso non autorizzato/i)).toBeInTheDocument();
  });

  it('logs out from profile page', async () => {
    sessionStorage.setItem('medicareHub.accessToken', 'token');
    sessionStorage.setItem(
      'medicareHub.user',
      JSON.stringify({
        id: 1,
        firstName: 'Aurora',
        lastName: 'Admin',
        email: 'admin@aurora.test',
        role: 'ADMIN'
      })
    );
    authApi.getProfile.mockResolvedValue({
      id: 1,
      firstName: 'Aurora',
      lastName: 'Admin',
      email: 'admin@aurora.test',
      role: 'ADMIN'
    });

    renderApp(['/profile']);

    fireEvent.click(await screen.findByRole('button', { name: /^esci$/i, hidden: false }));

    await waitFor(() => {
      expect(sessionStorage.getItem('medicareHub.accessToken')).toBeNull();
    });
    expect(await screen.findByLabelText(/email/i)).toBeInTheDocument();
  });

  it('clears session on centralized 401 handling', async () => {
    sessionStorage.setItem('medicareHub.accessToken', 'token');
    sessionStorage.setItem(
      'medicareHub.user',
      JSON.stringify({
        id: 1,
        firstName: 'Aurora',
        lastName: 'Admin',
        role: 'ADMIN'
      })
    );
    authApi.getProfile.mockResolvedValue({
      id: 1,
      firstName: 'Aurora',
      lastName: 'Admin',
      role: 'ADMIN'
    });

    renderApp(['/dashboard']);
    await screen.findByText(/cruscotto operativo/i);

    const unauthorizedHandler = vi.fn();
    configureApiClient({
      getToken: () => sessionStorage.getItem('medicareHub.accessToken'),
      onUnauthorized: unauthorizedHandler
    });

    const normalized = normalizeApiError({
      response: {
        status: 401,
        data: {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Token non valido',
            details: []
          }
        }
      },
      message: 'Request failed',
      config: {}
    });

    await unauthorizedHandler(normalized);
    sessionStorage.clear();

    expect(sessionStorage.getItem('medicareHub.accessToken')).toBeNull();
  });

  it('restores session by calling auth/me on load', async () => {
    sessionStorage.setItem('medicareHub.accessToken', 'token');
    sessionStorage.setItem(
      'medicareHub.user',
      JSON.stringify({
        id: 6,
        firstName: 'Luca',
        lastName: 'Moretti',
        email: 'doctor.luca.moretti@aurora.test',
        role: 'DOCTOR'
      })
    );
    authApi.getProfile.mockResolvedValue({
      id: 6,
      firstName: 'Luca',
      lastName: 'Moretti',
      email: 'doctor.luca.moretti@aurora.test',
      role: 'DOCTOR',
      doctorId: 6
    });

    renderApp(['/profile']);

    expect(await screen.findByRole('heading', { name: /profilo utente/i })).toBeInTheDocument();
    expect(authApi.getProfile).toHaveBeenCalledTimes(1);
  });

  it('shows doctor self-service medical services controls in profile', async () => {
    sessionStorage.setItem('medicareHub.accessToken', 'token');
    sessionStorage.setItem(
      'medicareHub.user',
      JSON.stringify({
        id: 6,
        firstName: 'Luca',
        lastName: 'Moretti',
        email: 'doctor.luca.moretti@aurora.test',
        role: 'DOCTOR',
        doctorId: 6
      })
    );
    authApi.getProfile.mockResolvedValue({
      id: 6,
      firstName: 'Luca',
      lastName: 'Moretti',
      email: 'doctor.luca.moretti@aurora.test',
      role: 'DOCTOR',
      doctorId: 6
    });
    doctorsApi.getCurrent.mockResolvedValue({
      id: 6,
      specialty: {
        id: 1,
        name: 'Cardiologia'
      },
      licenseNumber: 'AUR-MED-006',
      medicalServices: [
        {
          id: 3,
          name: 'Visita cardiologica'
        }
      ]
    });
    doctorsApi.listAvailableForCurrent.mockResolvedValue([
      {
        id: 3,
        name: 'Visita cardiologica',
        specialty: {
          id: 1,
          name: 'Cardiologia'
        }
      }
    ]);

    renderApp(['/profile']);

    expect(await screen.findByText(/prestazioni del medico/i)).toBeInTheDocument();
    expect(doctorsApi.getCurrent).toHaveBeenCalledTimes(1);
    expect(doctorsApi.listAvailableForCurrent).toHaveBeenCalledTimes(1);
  });
});
