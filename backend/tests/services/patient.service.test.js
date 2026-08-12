import { describe, expect, it, vi } from 'vitest';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError
} from '../../src/errors/AppError.js';
import { PatientService } from '../../src/services/PatientService.js';
import { USER_ROLES } from '../../src/utils/constants.js';

describe('PatientService', () => {
  it('limits doctor patient list to linked patients only', async () => {
    const repository = {
      findPaginated: vi.fn().mockResolvedValue({
        rows: [
          {
            id: 10,
            firstName: 'Anna',
            lastName: 'Ferri',
            birthDate: '1984-02-14',
            email: 'anna@patients.test',
            phone: '3201000001',
            fiscalCode: 'FKEANN84B54A001A',
            isActive: true,
            createdAt: '2026-08-01T08:00:00.000Z',
            updatedAt: '2026-08-02T08:00:00.000Z'
          }
        ],
        count: 1
      })
    };
    const doctors = {
      findByUserId: vi.fn().mockResolvedValue({ id: 6 })
    };
    const service = new PatientService(repository, doctors);

    const result = await service.list(
      {
        page: 1,
        pageSize: 20,
        search: 'anna'
      },
      {
        role: USER_ROLES.DOCTOR,
        sub: '9'
      }
    );

    expect(doctors.findByUserId).toHaveBeenCalledWith(9);
    expect(repository.findPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        doctorId: 6,
        search: 'anna'
      })
    );
    expect(result.data).toHaveLength(1);
    expect(result.meta.totalItems).toBe(1);
  });

  it('rejects duplicate fiscal code', async () => {
    const repository = {
      findByFiscalCode: vi.fn().mockResolvedValue({ id: 1 })
    };
    const service = new PatientService(repository, {});

    await expect(
      service.create({
        firstName: 'Anna',
        lastName: 'Ferri',
        birthDate: '1984-02-14',
        email: 'anna@patients.test',
        phone: '3201000001',
        fiscalCode: 'FKEANN84B54A001A'
      })
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('allows doctor to read linked patient', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue({
        id: 10,
        firstName: 'Anna',
        lastName: 'Ferri',
        birthDate: '1984-02-14',
        email: 'anna@patients.test',
        phone: '3201000001',
        fiscalCode: 'FKEANN84B54A001A',
        isActive: true
      }),
      isLinkedToDoctor: vi.fn().mockResolvedValue(true)
    };
    const doctors = {
      findByUserId: vi.fn().mockResolvedValue({ id: 6 })
    };
    const service = new PatientService(repository, doctors);

    const result = await service.getById(10, {
      role: USER_ROLES.DOCTOR,
      sub: '9'
    });

    expect(result.id).toBe(10);
  });

  it('denies doctor access to unrelated patient', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue({
        id: 11,
        firstName: 'Matteo',
        lastName: 'Leone'
      }),
      isLinkedToDoctor: vi.fn().mockResolvedValue(false)
    };
    const doctors = {
      findByUserId: vi.fn().mockResolvedValue({ id: 6 })
    };
    const service = new PatientService(repository, doctors);

    await expect(
      service.getById(11, {
        role: USER_ROLES.DOCTOR,
        sub: '9'
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('fails on missing patient', async () => {
    const service = new PatientService(
      {
        findById: vi.fn().mockResolvedValue(null)
      },
      {}
    );

    await expect(
      service.getById(999, {
        role: USER_ROLES.ADMIN
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
