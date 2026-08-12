import { describe, expect, it, vi } from 'vitest';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError
} from '../../src/errors/AppError.js';
import { MedicalServiceService } from '../../src/services/MedicalServiceService.js';
import { USER_ROLES } from '../../src/utils/constants.js';

describe('MedicalServiceService', () => {
  it('filters medical services for doctor role', async () => {
    const repository = {
      findPaginated: vi.fn().mockResolvedValue({
        rows: [{ id: 1, name: 'Visita cardiologica' }],
        count: 1
      })
    };
    const specialties = {};
    const doctors = {
      findByUserId: vi.fn().mockResolvedValue({ id: 12 })
    };
    const service = new MedicalServiceService(repository, specialties, doctors);

    const result = await service.list({}, { role: USER_ROLES.DOCTOR, sub: '4' });

    expect(repository.findPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ doctorId: 12 })
    );
    expect(result.meta.totalItems).toBe(1);
  });

  it('rejects doctor without linked profile', async () => {
    const service = new MedicalServiceService(
      {},
      {},
      {
        findByUserId: vi.fn().mockResolvedValue(null)
      }
    );

    await expect(
      service.list({}, { role: USER_ROLES.DOCTOR, sub: '4' })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('rejects missing specialty on create', async () => {
    const repository = {};
    const specialties = {
      findById: vi.fn().mockResolvedValue(null)
    };
    const service = new MedicalServiceService(repository, specialties, {});

    await expect(
      service.create({
        specialtyId: 7,
        name: 'Nuova prestazione',
        durationMinutes: 30,
        currentPrice: 90
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects duplicate medical service name in same specialty', async () => {
    const repository = {
      findByNameInSpecialty: vi.fn().mockResolvedValue({ id: 1 })
    };
    const specialties = {
      findById: vi.fn().mockResolvedValue({ id: 1 })
    };
    const service = new MedicalServiceService(repository, specialties, {});

    await expect(
      service.create({
        specialtyId: 1,
        name: 'Visita cardiologica',
        durationMinutes: 30,
        currentPrice: 120
      })
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
