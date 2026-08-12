import { describe, expect, it, vi } from 'vitest';
import { BadRequestError, ForbiddenError } from '../../src/errors/AppError.js';
import { DashboardService } from '../../src/services/DashboardService.js';
import { USER_ROLES } from '../../src/utils/constants.js';

describe('DashboardService', () => {
  it('returns normalized summary metrics', async () => {
    const service = new DashboardService(
      {
        getSummary: vi.fn().mockResolvedValue({
          totalAppointments: '12',
          scheduledAppointments: '3',
          confirmedAppointments: '2',
          completedAppointments: '4',
          cancelledAppointments: '2',
          noShowAppointments: '1',
          activePatients: '7',
          theoreticalRevenue: '420.50'
        })
      },
      {}
    );

    const result = await service.getSummary({}, { role: USER_ROLES.ADMIN, sub: '1' });

    expect(result.totalAppointments).toBe(12);
    expect(result.theoreticalRevenue).toBe(420.5);
  });

  it('applies doctor scope automatically for DOCTOR', async () => {
    const repository = {
      getSummary: vi.fn().mockResolvedValue({
        totalAppointments: '2',
        scheduledAppointments: '1',
        confirmedAppointments: '1',
        completedAppointments: '0',
        cancelledAppointments: '0',
        noShowAppointments: '0',
        activePatients: '2',
        theoreticalRevenue: '0'
      })
    };
    const doctors = {
      findByUserId: vi.fn().mockResolvedValue({ id: 6 })
    };
    const service = new DashboardService(repository, doctors);

    await service.getSummary({ doctorId: 6 }, { role: USER_ROLES.DOCTOR, sub: '8' });

    expect(repository.getSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        doctorId: 6
      })
    );
  });

  it('rejects doctor filter for another doctor', async () => {
    const service = new DashboardService(
      {},
      {
        findByUserId: vi.fn().mockResolvedValue({ id: 6 })
      }
    );

    await expect(
      service.getSummary({ doctorId: 7 }, { role: USER_ROLES.DOCTOR, sub: '8' })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('returns trend rows with numeric aggregates', async () => {
    const service = new DashboardService(
      {
        getAppointmentsTrend: vi.fn().mockResolvedValue([
          {
            period: '2026-08-01',
            totalAppointments: '5',
            scheduledAppointments: '1',
            confirmedAppointments: '1',
            completedAppointments: '3',
            cancelledAppointments: '0',
            noShowAppointments: '1',
            theoreticalRevenue: '300.00'
          }
        ])
      },
      {}
    );

    const result = await service.getAppointmentsTrend(
      { groupBy: 'day' },
      { role: USER_ROLES.RECEPTIONIST, sub: '2' }
    );

    expect(result[0].completedAppointments).toBe(3);
    expect(result[0].noShowAppointments).toBe(1);
    expect(result[0].theoreticalRevenue).toBe(300);
  });

  it('returns by-specialty aggregates', async () => {
    const service = new DashboardService(
      {
        getBySpecialty: vi.fn().mockResolvedValue([
          {
            specialtyId: '1',
            specialtyName: 'Cardiologia',
            totalAppointments: '8',
            completedAppointments: '5',
            theoreticalRevenue: '500.00'
          }
        ])
      },
      {}
    );

    const result = await service.getBySpecialty({}, { role: USER_ROLES.ADMIN, sub: '1' });

    expect(result[0].specialty.name).toBe('Cardiologia');
    expect(result[0].theoreticalRevenue).toBe(500);
  });

  it('returns upcoming list with numeric snapshots', async () => {
    const service = new DashboardService(
      {
        getUpcoming: vi.fn().mockResolvedValue([
          {
            id: '90',
            patientId: '30',
            doctorId: '6',
            medicalServiceId: '3',
            scheduledAt: '2026-08-10T08:00:00.000Z',
            endAt: '2026-08-10T08:30:00.000Z',
            durationMinutesSnapshot: '30',
            priceSnapshot: '100.00',
            status: 'CONFIRMED',
            operationalNotes: null,
            patientFirstName: 'Anna',
            patientLastName: 'Ferri',
            doctorFirstName: 'Luca',
            doctorLastName: 'Moretti',
            medicalServiceName: 'Visita cardiologica',
            specialtyName: 'Cardiologia'
          }
        ])
      },
      {}
    );

    const result = await service.getUpcoming(
      { limit: 5 },
      { role: USER_ROLES.RECEPTIONIST, sub: '2' }
    );

    expect(result[0].priceSnapshot).toBe(100);
    expect(result[0].patient.lastName).toBe('Ferri');
  });

  it('rejects invalid date range', async () => {
    const service = new DashboardService({}, {});

    await expect(
      service.getSummary(
        {
          dateFrom: '2026-08-31T00:00:00.000Z',
          dateTo: '2026-08-01T00:00:00.000Z'
        },
        { role: USER_ROLES.ADMIN, sub: '1' }
      )
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
