import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appointmentsApi } from '../api/appointmentsApi';
import { doctorsApi } from '../api/doctorsApi';
import { medicalServicesApi } from '../api/medicalServicesApi';
import { patientsApi } from '../api/patientsApi';
import { specialtiesApi } from '../api/specialtiesApi';
import { useAuth } from '../hooks/useAuth';
import { AppointmentsPage } from '../pages/AppointmentsPage';
import {
  canEditAppointment,
  getAllowedAppointmentTransitions,
  shouldConfirmAppointmentStatus
} from '../pages/appointments.utils';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('../contexts/SnackbarContext', () => ({
  useSnackbar: () => ({
    showSnackbar: vi.fn()
  })
}));

vi.mock('../api/appointmentsApi', () => ({
  appointmentsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    cancel: vi.fn()
  }
}));

vi.mock('../api/doctorsApi', () => ({
  doctorsApi: {
    list: vi.fn(),
    getById: vi.fn(),
    getAvailableSlots: vi.fn()
  }
}));

vi.mock('../api/patientsApi', () => ({
  patientsApi: {
    list: vi.fn()
  }
}));

vi.mock('../api/medicalServicesApi', () => ({
  medicalServicesApi: {
    list: vi.fn()
  }
}));

vi.mock('../api/specialtiesApi', () => ({
  specialtiesApi: {
    list: vi.fn()
  }
}));

const sampleAppointment = {
  id: 101,
  patientId: 1,
  doctorId: 3,
  medicalServiceId: 10,
  scheduledAt: '2026-08-09T08:00:00.000Z',
  endAt: '2026-08-09T08:30:00.000Z',
  durationMinutesSnapshot: 30,
  priceSnapshot: 120,
  status: 'SCHEDULED',
  operationalNotes: 'Portare documenti',
  patient: {
    id: 1,
    firstName: 'Mario',
    lastName: 'Rossi'
  },
  doctor: {
    id: 3,
    specialty: {
      id: 7,
      name: 'Cardiologia'
    },
    user: {
      firstName: 'Lucia',
      lastName: 'Bianchi'
    }
  },
  medicalService: {
    id: 10,
    name: 'Visita cardiologica',
    specialty: {
      id: 7,
      name: 'Cardiologia'
    }
  }
};

const doctorDetail = {
  id: 3,
  user: {
    firstName: 'Lucia',
    lastName: 'Bianchi'
  },
  medicalServices: [
    {
      id: 10,
      name: 'Visita cardiologica',
      durationMinutes: 30,
      currentPrice: 120,
      isActive: true
    }
  ]
};

function renderPage() {
  return render(
    <MemoryRouter>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
        <AppointmentsPage />
      </LocalizationProvider>
    </MemoryRouter>
  );
}

async function selectMenuItem(container, label, optionText) {
  const field = within(container).getByLabelText(label);
  fireEvent.mouseDown(field);
  const option = await screen.findByRole('option', { name: optionText });
  fireEvent.click(option);
}

describe('frontend appointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    appointmentsApi.list.mockResolvedValue({
      data: [sampleAppointment],
      meta: {
        page: 1,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1
      }
    });
    appointmentsApi.create.mockResolvedValue(sampleAppointment);
    appointmentsApi.update.mockResolvedValue(sampleAppointment);
    appointmentsApi.updateStatus.mockResolvedValue({
      ...sampleAppointment,
      status: 'CONFIRMED'
    });

    patientsApi.list.mockResolvedValue({
      data: [
        {
          id: 1,
          firstName: 'Mario',
          lastName: 'Rossi'
        }
      ],
      meta: {}
    });

    doctorsApi.list.mockResolvedValue({
      data: [
        {
          id: 3,
          user: {
            firstName: 'Lucia',
            lastName: 'Bianchi'
          }
        }
      ],
      meta: {}
    });

    doctorsApi.getById.mockResolvedValue(doctorDetail);
    doctorsApi.getAvailableSlots.mockResolvedValue({
      date: '2026-08-09',
      medicalService: {
        id: 10,
        name: 'Visita cardiologica',
        durationMinutes: 30
      },
      slots: [
        {
          startAt: '2026-08-09T08:00:00.000Z',
          endAt: '2026-08-09T08:30:00.000Z',
          startTime: '10:00',
          endTime: '10:30'
        }
      ]
    });

    medicalServicesApi.list.mockResolvedValue({
      data: [
        {
          id: 10,
          name: 'Visita cardiologica',
          currentPrice: 120,
          durationMinutes: 30,
          specialty: {
            id: 7,
            name: 'Cardiologia'
          }
        }
      ],
      meta: {}
    });

    specialtiesApi.list.mockResolvedValue({
      data: [
        {
          id: 7,
          name: 'Cardiologia'
        }
      ],
      meta: {}
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('creates an appointment without sending manual duration or price', async () => {
    useAuth.mockReturnValue({
      user: {
        id: 1,
        role: 'ADMIN'
      }
    });

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /nuovo appuntamento/i }));
    const dialog = await screen.findByRole('dialog');

    await selectMenuItem(dialog, /paziente/i, /mario rossi/i);
    await selectMenuItem(dialog, /medico/i, /lucia bianchi/i);
    await waitFor(() => {
      expect(doctorsApi.getById).toHaveBeenCalledWith(3);
    });
    await selectMenuItem(dialog, /prestazione offerta/i, /visita cardiologica/i);

    fireEvent.change(within(dialog).getByTestId('appointment-date-input'), {
      target: { value: '09/08/2026' }
    });

    await waitFor(() => {
      expect(doctorsApi.getAvailableSlots).toHaveBeenCalledWith(3, {
        date: expect.any(String),
        medicalServiceId: 10
      });
    });

    fireEvent.click(await within(dialog).findByRole('button', { name: /10:00 - 10:30/i }));
    fireEvent.change(within(dialog).getByLabelText(/note operative/i), {
      target: { value: 'Arrivare 10 minuti prima' }
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /conferma appuntamento/i }));

    await waitFor(() => {
      expect(appointmentsApi.create).toHaveBeenCalledTimes(1);
    });

    const payload = appointmentsApi.create.mock.calls[0][0];
    expect(payload).toEqual({
      patientId: 1,
      doctorId: 3,
      medicalServiceId: 10,
      scheduledAt: '2026-08-09T08:00:00.000Z',
      operationalNotes: 'Arrivare 10 minuti prima'
    });
    expect(payload).not.toHaveProperty('durationMinutes');
    expect(payload).not.toHaveProperty('priceSnapshot');
    expect(payload).not.toHaveProperty('currentPrice');
  }, 10000);

  it('loads the doctor agenda from today onward and hides the doctor selector', async () => {
    useAuth.mockReturnValue({
      user: {
        id: 6,
        role: 'DOCTOR'
      }
    });

    renderPage();

    expect(
      await screen.findByText(/agenda personale del medico con appuntamenti odierni e futuri/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /nuovo appuntamento/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^medico$/i)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(appointmentsApi.list).toHaveBeenCalled();
    });

    expect(appointmentsApi.list.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        dateFrom: expect.any(String)
      })
    );
  });

  it('exposes only allowed frontend status transitions helpers', () => {
    expect(getAllowedAppointmentTransitions('SCHEDULED', 'ADMIN')).toEqual([
      'CONFIRMED',
      'CANCELLED'
    ]);
    expect(getAllowedAppointmentTransitions('CANCELLED', 'ADMIN')).toEqual(['SCHEDULED']);
    expect(getAllowedAppointmentTransitions('NO_SHOW', 'ADMIN')).toEqual(['SCHEDULED']);
    expect(getAllowedAppointmentTransitions('SCHEDULED', 'DOCTOR')).toEqual(['CONFIRMED']);
    expect(getAllowedAppointmentTransitions('CONFIRMED', 'DOCTOR')).toEqual([
      'COMPLETED',
      'NO_SHOW'
    ]);
    expect(getAllowedAppointmentTransitions('CANCELLED', 'DOCTOR')).toEqual([]);
    expect(shouldConfirmAppointmentStatus('CANCELLED')).toBe(true);
    expect(shouldConfirmAppointmentStatus('CONFIRMED')).toBe(false);
    expect(canEditAppointment('SCHEDULED')).toBe(true);
    expect(canEditAppointment('COMPLETED')).toBe(false);
  });

  it('shows appointment status options instead of generic active filters', async () => {
    useAuth.mockReturnValue({
      user: {
        id: 1,
        role: 'ADMIN'
      }
    });

    renderPage();

    const statusField = await screen.findByLabelText(/^stato$/i);
    fireEvent.mouseDown(statusField);

    expect(await screen.findByRole('option', { name: /tutti gli stati/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /programmato/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /confermato/i })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /solo attivi/i })).not.toBeInTheDocument();
  });

  it('applies the selected period preset to the appointment filters', async () => {
    useAuth.mockReturnValue({
      user: {
        id: 1,
        role: 'ADMIN'
      }
    });

    renderPage();

    const callsBeforeFilter = appointmentsApi.list.mock.calls.length;
    const periodField = await screen.findByLabelText(/^periodo$/i);
    fireEvent.mouseDown(periodField);
    fireEvent.click(await screen.findByRole('option', { name: /appuntamenti di oggi/i }));

    await waitFor(() => {
      expect(appointmentsApi.list.mock.calls.length).toBeGreaterThan(callsBeforeFilter);
    });

    const lastCall = appointmentsApi.list.mock.calls.at(-1)[0];
    const startOfToday = dayjs().startOf('day').toISOString();
    const endOfToday = dayjs().endOf('day').toISOString();

    expect(lastCall).toEqual(
      expect.objectContaining({
        dateFrom: startOfToday,
        dateTo: endOfToday
      })
    );
  });

  it('applies the free text filter automatically without clicking apply', async () => {
    useAuth.mockReturnValue({
      user: {
        id: 1,
        role: 'ADMIN'
      }
    });

    renderPage();

    const callsBeforeSearch = appointmentsApi.list.mock.calls.length;
    fireEvent.change(await screen.findByLabelText(/ricerca libera/i), {
      target: { value: 'rossi' }
    });

    await waitFor(() => {
      expect(appointmentsApi.list.mock.calls.length).toBeGreaterThan(callsBeforeSearch);
    });

    const lastCall = appointmentsApi.list.mock.calls.at(-1)[0];
    expect(lastCall).toEqual(
      expect.objectContaining({
        search: 'rossi'
      })
    );
    expect(screen.queryByRole('button', { name: /applica filtri/i })).not.toBeInTheDocument();
  });

  it('loads slots automatically and shows the guided slot selector', async () => {
    useAuth.mockReturnValue({
      user: {
        id: 1,
        role: 'ADMIN'
      }
    });

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /nuovo appuntamento/i }));
    const dialog = await screen.findByRole('dialog');

    expect(
      within(dialog).getByText(/gli slot vengono caricati automaticamente/i)
    ).toBeInTheDocument();

    await selectMenuItem(dialog, /paziente/i, /mario rossi/i);
    await selectMenuItem(dialog, /medico/i, /lucia bianchi/i);
    await waitFor(() => {
      expect(doctorsApi.getById).toHaveBeenCalledWith(3);
    });
    await selectMenuItem(dialog, /prestazione offerta/i, /visita cardiologica/i);

    fireEvent.change(within(dialog).getByTestId('appointment-date-input'), {
      target: { value: '09/08/2026' }
    });

    expect(await within(dialog).findByRole('button', { name: /10:00 - 10:30/i })).toBeInTheDocument();
  });
});
