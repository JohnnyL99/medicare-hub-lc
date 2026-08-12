import { describe, expect, it, vi } from 'vitest';
import { ConflictError, ForbiddenError } from '../../src/errors/AppError.js';
import {
  AppointmentInThePastError,
  AppointmentOverlapError,
  AppointmentService,
  DoctorServiceNotAllowedError,
  InvalidStatusTransitionError,
  OutsideDoctorAvailabilityError,
  ResourceNotActiveError
} from '../../src/services/AppointmentService.js';
import { APPOINTMENT_STATUSES, USER_ROLES } from '../../src/utils/constants.js';

function createTransactionProvider() {
  return {
    transaction: vi.fn(async (callback) => callback({}))
  };
}

describe('AppointmentService', () => {
  it('creates a valid appointment with historical snapshots', async () => {
    const service = new AppointmentService(
      {
        findOverlap: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 41 }),
        findById: vi.fn().mockResolvedValue({
          id: 41,
          patientId: 30,
          doctorId: 6,
          medicalServiceId: 3,
          scheduledAt: new Date('2026-08-17T07:00:00.000Z'),
          endAt: new Date('2026-08-17T07:30:00.000Z'),
          durationMinutesSnapshot: 30,
          priceSnapshot: '120.00',
          status: APPOINTMENT_STATUSES.SCHEDULED,
          operationalNotes: 'Richiamare il giorno prima',
          createdBy: 2
        })
      },
      {
        findById: vi.fn().mockResolvedValue({ id: 30, isActive: true })
      },
      {
        findById: vi.fn().mockResolvedValue({ id: 6, isActive: true }),
        findByUserId: vi.fn()
      },
      {
        findById: vi.fn().mockResolvedValue({
          id: 3,
          durationMinutes: 30,
          currentPrice: '120.00',
          isActive: true
        })
      },
      {
        exists: vi.fn().mockResolvedValue(true)
      },
      {
        findActiveByDoctorAndWeekday: vi.fn().mockResolvedValue([
          {
            startTime: '09:00:00',
            endTime: '12:00:00'
          }
        ])
      },
      createTransactionProvider()
    );

    const result = await service.create(
      {
        patientId: 30,
        doctorId: 6,
        medicalServiceId: 3,
        scheduledAt: '2026-08-17T07:00:00.000Z',
        operationalNotes: 'Richiamare il giorno prima'
      },
      { role: USER_ROLES.RECEPTIONIST, sub: '2' }
    );

    expect(result.durationMinutesSnapshot).toBe(30);
    expect(result.priceSnapshot).toBe('120.00');
  });

  it('rejects overlapping appointments', async () => {
    const service = new AppointmentService(
      {
        findOverlap: vi.fn().mockResolvedValue({ id: 99 })
      },
      {
        findById: vi.fn().mockResolvedValue({ id: 30, isActive: true })
      },
      {
        findById: vi.fn().mockResolvedValue({ id: 6, isActive: true }),
        findByUserId: vi.fn()
      },
      {
        findById: vi.fn().mockResolvedValue({
          id: 3,
          durationMinutes: 30,
          currentPrice: '120.00',
          isActive: true
        })
      },
      {
        exists: vi.fn().mockResolvedValue(true)
      },
      {
        findActiveByDoctorAndWeekday: vi.fn().mockResolvedValue([
          {
            startTime: '09:00:00',
            endTime: '12:00:00'
          }
        ])
      },
      createTransactionProvider()
    );

    await expect(
      service.create(
        {
          patientId: 30,
          doctorId: 6,
          medicalServiceId: 3,
          scheduledAt: '2026-08-17T07:00:00.000Z'
        },
        { role: USER_ROLES.ADMIN, sub: '1' }
      )
    ).rejects.toBeInstanceOf(AppointmentOverlapError);
  });

  it('allows adjacent appointments without overlap', async () => {
    const appointments = {
      findOverlap: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 77 }),
      findById: vi.fn().mockResolvedValue({
        id: 77,
        patientId: 30,
        doctorId: 6,
        medicalServiceId: 3,
        scheduledAt: new Date('2026-08-17T08:00:00.000Z'),
        endAt: new Date('2026-08-17T08:30:00.000Z'),
        durationMinutesSnapshot: 30,
        priceSnapshot: '120.00',
        status: APPOINTMENT_STATUSES.SCHEDULED,
        createdBy: 1
      })
    };
    const service = new AppointmentService(
      appointments,
      {
        findById: vi.fn().mockResolvedValue({ id: 30, isActive: true })
      },
      {
        findById: vi.fn().mockResolvedValue({ id: 6, isActive: true }),
        findByUserId: vi.fn()
      },
      {
        findById: vi.fn().mockResolvedValue({
          id: 3,
          durationMinutes: 30,
          currentPrice: '120.00',
          isActive: true
        })
      },
      {
        exists: vi.fn().mockResolvedValue(true)
      },
      {
        findActiveByDoctorAndWeekday: vi.fn().mockResolvedValue([
          {
            startTime: '09:00:00',
            endTime: '12:00:00'
          }
        ])
      },
      createTransactionProvider()
    );

    const result = await service.create(
      {
        patientId: 30,
        doctorId: 6,
        medicalServiceId: 3,
        scheduledAt: '2026-08-17T08:00:00.000Z'
      },
      { role: USER_ROLES.ADMIN, sub: '1' }
    );

    expect(result.id).toBe(77);
  });

  it('rejects appointments for services not offered by the doctor', async () => {
    const service = new AppointmentService(
      {},
      { findById: vi.fn().mockResolvedValue({ id: 30, isActive: true }) },
      { findById: vi.fn().mockResolvedValue({ id: 6, isActive: true }), findByUserId: vi.fn() },
      {
        findById: vi.fn().mockResolvedValue({
          id: 3,
          durationMinutes: 30,
          currentPrice: '120.00',
          isActive: true
        })
      },
      { exists: vi.fn().mockResolvedValue(false) },
      {},
      createTransactionProvider()
    );

    await expect(
      service.create(
        {
          patientId: 30,
          doctorId: 6,
          medicalServiceId: 3,
          scheduledAt: '2026-08-17T07:00:00.000Z'
        },
        { role: USER_ROLES.ADMIN, sub: '1' }
      )
    ).rejects.toBeInstanceOf(DoctorServiceNotAllowedError);
  });

  it('rejects appointments outside doctor availability', async () => {
    const service = new AppointmentService(
      {},
      { findById: vi.fn().mockResolvedValue({ id: 30, isActive: true }) },
      { findById: vi.fn().mockResolvedValue({ id: 6, isActive: true }), findByUserId: vi.fn() },
      {
        findById: vi.fn().mockResolvedValue({
          id: 3,
          durationMinutes: 30,
          currentPrice: '120.00',
          isActive: true
        })
      },
      { exists: vi.fn().mockResolvedValue(true) },
      {
        findActiveByDoctorAndWeekday: vi.fn().mockResolvedValue([
          {
            startTime: '11:00:00',
            endTime: '12:00:00'
          }
        ])
      },
      createTransactionProvider()
    );

    await expect(
      service.create(
        {
          patientId: 30,
          doctorId: 6,
          medicalServiceId: 3,
          scheduledAt: '2026-08-17T07:00:00.000Z'
        },
        { role: USER_ROLES.ADMIN, sub: '1' }
      )
    ).rejects.toBeInstanceOf(OutsideDoctorAvailabilityError);
  });

  it('rejects appointments in the past', async () => {
    const service = new AppointmentService(
      {},
      { findById: vi.fn().mockResolvedValue({ id: 30, isActive: true }) },
      { findById: vi.fn().mockResolvedValue({ id: 6, isActive: true }), findByUserId: vi.fn() },
      {
        findById: vi.fn().mockResolvedValue({
          id: 3,
          durationMinutes: 30,
          currentPrice: '120.00',
          isActive: true
        })
      },
      { exists: vi.fn().mockResolvedValue(true) },
      {
        findActiveByDoctorAndWeekday: vi.fn().mockResolvedValue([
          {
            startTime: '09:00:00',
            endTime: '12:00:00'
          }
        ])
      },
      createTransactionProvider()
    );

    await expect(
      service.create(
        {
          patientId: 30,
          doctorId: 6,
          medicalServiceId: 3,
          scheduledAt: '2026-08-01T07:00:00.000Z'
        },
        { role: USER_ROLES.ADMIN, sub: '1' }
      )
    ).rejects.toBeInstanceOf(AppointmentInThePastError);
  });

  it('rejects updates on completed appointments', async () => {
    const service = new AppointmentService(
      {
        findById: vi.fn().mockResolvedValue({
          id: 88,
          status: APPOINTMENT_STATUSES.COMPLETED,
          doctorId: 6
        })
      },
      {},
      {
        findByUserId: vi.fn()
      },
      {},
      {},
      {},
      createTransactionProvider()
    );

    await expect(
      service.update(
        88,
        {
          operationalNotes: 'Tentativo modifica'
        },
        { role: USER_ROLES.ADMIN, sub: '1' }
      )
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('allows reopening a cancelled appointment to scheduled', async () => {
    const service = new AppointmentService(
      {
        findById: vi.fn().mockResolvedValue({
          id: 55,
          status: APPOINTMENT_STATUSES.CANCELLED,
          doctorId: 6,
          update: vi.fn().mockResolvedValue({
            id: 55,
            status: APPOINTMENT_STATUSES.SCHEDULED
          })
        }),
        update: vi.fn().mockResolvedValue({
          id: 55,
          status: APPOINTMENT_STATUSES.SCHEDULED
        })
      },
      {},
      { findByUserId: vi.fn() },
      {},
      {},
      {},
      createTransactionProvider()
    );

    const result = await service.updateStatus(
      55,
      APPOINTMENT_STATUSES.SCHEDULED,
      { role: USER_ROLES.ADMIN, sub: '1' }
    );

    expect(result.status).toBe(APPOINTMENT_STATUSES.SCHEDULED);
  });

  it('allows reopening a no-show appointment to scheduled', async () => {
    const service = new AppointmentService(
      {
        findById: vi.fn().mockResolvedValue({
          id: 56,
          status: APPOINTMENT_STATUSES.NO_SHOW,
          doctorId: 6,
          update: vi.fn().mockResolvedValue({
            id: 56,
            status: APPOINTMENT_STATUSES.SCHEDULED
          })
        }),
        update: vi.fn().mockResolvedValue({
          id: 56,
          status: APPOINTMENT_STATUSES.SCHEDULED
        })
      },
      {},
      { findByUserId: vi.fn() },
      {},
      {},
      {},
      createTransactionProvider()
    );

    const result = await service.updateStatus(
      56,
      APPOINTMENT_STATUSES.SCHEDULED,
      { role: USER_ROLES.RECEPTIONIST, sub: '2' }
    );

    expect(result.status).toBe(APPOINTMENT_STATUSES.SCHEDULED);
  });

  it('rejects inactive resources', async () => {
    const service = new AppointmentService(
      {},
      { findById: vi.fn().mockResolvedValue({ id: 30, isActive: false }) },
      { findById: vi.fn().mockResolvedValue({ id: 6, isActive: true }), findByUserId: vi.fn() },
      {
        findById: vi.fn().mockResolvedValue({
          id: 3,
          durationMinutes: 30,
          currentPrice: '120.00',
          isActive: true
        })
      },
      { exists: vi.fn().mockResolvedValue(true) },
      {},
      createTransactionProvider()
    );

    await expect(
      service.create(
        {
          patientId: 30,
          doctorId: 6,
          medicalServiceId: 3,
          scheduledAt: '2026-08-17T07:00:00.000Z'
        },
        { role: USER_ROLES.ADMIN, sub: '1' }
      )
    ).rejects.toBeInstanceOf(ResourceNotActiveError);
  });

  it('allows doctor to update only own operational notes', async () => {
    const service = new AppointmentService(
      {
        findById: vi.fn().mockResolvedValue({
          id: 90,
          doctorId: 6,
          operationalNotes: null
        }),
        update: vi.fn().mockResolvedValue({
          id: 90,
          doctorId: 6,
          operationalNotes: 'Portare documenti',
          status: APPOINTMENT_STATUSES.CONFIRMED
        })
      },
      {},
      {
        findByUserId: vi.fn().mockResolvedValue({ id: 6 })
      },
      {},
      {},
      {}
    );

    const result = await service.update(
      90,
      {
        operationalNotes: 'Portare documenti'
      },
      { role: USER_ROLES.DOCTOR, sub: '8' }
    );

    expect(result.operationalNotes).toBe('Portare documenti');
  });

  it('prevents doctor from editing another doctor appointment', async () => {
    const service = new AppointmentService(
      {
        findById: vi.fn().mockResolvedValue({
          id: 91,
          doctorId: 7
        })
      },
      {},
      {
        findByUserId: vi.fn().mockResolvedValue({ id: 6 })
      },
      {},
      {},
      {}
    );

    await expect(
      service.updateStatus(91, APPOINTMENT_STATUSES.CONFIRMED, {
        role: USER_ROLES.DOCTOR,
        sub: '8'
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('enforces explicit status transitions', async () => {
    const service = new AppointmentService(
      {
        findById: vi.fn().mockResolvedValue({
          id: 92,
          doctorId: 6,
          status: APPOINTMENT_STATUSES.SCHEDULED
        })
      },
      {},
      {
        findByUserId: vi.fn().mockResolvedValue({ id: 6 })
      },
      {},
      {},
      {}
    );

    await expect(
      service.updateStatus(92, APPOINTMENT_STATUSES.COMPLETED, {
        role: USER_ROLES.ADMIN,
        sub: '1'
      })
    ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
  });
});
