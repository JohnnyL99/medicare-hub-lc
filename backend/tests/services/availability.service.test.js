import { describe, expect, it, vi } from 'vitest';
import { ForbiddenError } from '../../src/errors/AppError.js';
import {
  AvailabilityOverlapError,
  AvailabilityService
} from '../../src/services/AvailabilityService.js';
import { USER_ROLES } from '../../src/utils/constants.js';

describe('AvailabilityService', () => {
  it('rejects overlapping availabilities for the same doctor and weekday', async () => {
    const service = new AvailabilityService(
      {
        findOverlapping: vi.fn().mockResolvedValue({ id: 99 }),
        create: vi.fn()
      },
      {
        findById: vi.fn().mockResolvedValue({ id: 5, isActive: true })
      },
      {},
      {},
      {},
      {
        transaction: async (callback) => callback({})
      }
    );

    await expect(
      service.createForDoctor(
        5,
        {
          weekday: 1,
          startTime: '09:00:00',
          endTime: '12:00:00',
          isActive: true
        },
        { role: USER_ROLES.ADMIN, sub: '1' }
      )
    ).rejects.toBeInstanceOf(AvailabilityOverlapError);
  });

  it('prevents doctors from managing another doctor availability', async () => {
    const service = new AvailabilityService(
      {
        findById: vi.fn().mockResolvedValue({
          id: 11,
          doctorId: 8,
          weekday: 2,
          startTime: '09:00:00',
          endTime: '11:00:00',
          isActive: true
        })
      },
      {
        findByUserId: vi.fn().mockResolvedValue({ id: 6 })
      },
      {},
      {},
      {}
    );

    await expect(
      service.delete(11, {
        role: USER_ROLES.DOCTOR,
        sub: '30'
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('computes available slots excluding non-cancelled appointments and past slots', async () => {
    const service = new AvailabilityService(
      {
        findActiveByDoctorAndWeekday: vi.fn().mockResolvedValue([
          {
            id: 1,
            doctorId: 6,
            weekday: 1,
            startTime: '09:00:00',
            endTime: '10:30:00',
            isActive: true
          }
        ])
      },
      {
        findById: vi.fn().mockResolvedValue({ id: 6, isActive: true })
      },
      {
        findById: vi.fn().mockResolvedValue({
          id: 3,
          name: 'Visita cardiologica',
          durationMinutes: 30,
          isActive: true
        })
      },
      {
        exists: vi.fn().mockResolvedValue(true)
      },
      {
        findNonCancelledByDoctorBetween: vi.fn().mockResolvedValue([
          {
            scheduledAt: new Date('2026-08-10T07:30:00.000Z'),
            endAt: new Date('2026-08-10T08:00:00.000Z')
          }
        ])
      }
    );

    const result = await service.getAvailableSlots(
      6,
      {
        date: '2026-08-10',
        medicalServiceId: 3
      },
      { role: USER_ROLES.RECEPTIONIST, sub: '2' }
    );

    expect(result.slots).toEqual([
      {
        startAt: '2026-08-10T07:00:00.000Z',
        endAt: '2026-08-10T07:30:00.000Z',
        startTime: '09:00:00',
        endTime: '09:30:00'
      },
      {
        startAt: '2026-08-10T08:00:00.000Z',
        endAt: '2026-08-10T08:30:00.000Z',
        startTime: '10:00:00',
        endTime: '10:30:00'
      }
    ]);
  });
});
