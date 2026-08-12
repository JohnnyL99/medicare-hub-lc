import { describe, expect, it, vi } from 'vitest';
import { BadRequestError, ConflictError } from '../../src/errors/AppError.js';
import { DoctorAdminService } from '../../src/services/DoctorAdminService.js';

describe('DoctorAdminService', () => {
  it('rolls back in case of doctor creation error', async () => {
    const rollback = vi.fn();
    const commit = vi.fn();
    const transaction = { rollback, commit };
    const transactionProvider = {
      transaction: vi.fn(async (callback) => {
        try {
          const result = await callback(transaction);
          await commit();
          return result;
        } catch (error) {
          await rollback();
          throw error;
        }
      })
    };

    const service = new DoctorAdminService(
      {
        findByLicenseNumber: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockRejectedValue(new Error('doctor create failed'))
      },
      {
        findByEmail: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 22 })
      },
      {
        findById: vi.fn().mockResolvedValue({ id: 1 })
      },
      {
        findActiveByIds: vi.fn().mockResolvedValue([])
      },
      {
        replaceServices: vi.fn()
      },
      transactionProvider
    );

    await expect(
      service.create({
        firstName: 'Elena',
        lastName: 'Greco',
        email: 'doctor.elena.greco@aurora.test',
        passwordHash: 'hash',
        specialtyId: 1,
        licenseNumber: 'AUR-MED-010',
        medicalServiceIds: []
      })
    ).rejects.toThrow('doctor create failed');

    expect(rollback).toHaveBeenCalled();
  });

  it('rejects duplicate email during doctor creation', async () => {
    const transactionProvider = {
      transaction: vi.fn(async (callback) => callback({}))
    };
    const service = new DoctorAdminService(
      {},
      {
        findByEmail: vi.fn().mockResolvedValue({ id: 1 })
      },
      {},
      {},
      {},
      transactionProvider
    );

    await expect(
      service.create({
        email: 'doctor@aurora.test'
      })
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects inactive assigned services', async () => {
    const service = new DoctorAdminService(
      {
        findById: vi.fn().mockResolvedValue({
          id: 1,
          user: { id: 2 },
          medicalServices: []
        })
      },
      {},
      {},
      {
        findActiveByIds: vi.fn().mockResolvedValue([{ id: 1 }])
      },
      {},
      { transaction: vi.fn() }
    );

    await expect(service.replaceServices(1, [1, 2])).rejects.toBeInstanceOf(BadRequestError);
  });

  it('replaces doctor services successfully', async () => {
    const replaceServices = vi.fn();
    const service = new DoctorAdminService(
      {
        findById: vi
          .fn()
          .mockResolvedValueOnce({
            id: 1,
            user: { id: 2, firstName: 'Luca', lastName: 'Moretti', email: 'x', role: 'DOCTOR', isActive: true },
            primarySpecialty: { id: 1, name: 'Cardiologia', isActive: true },
            medicalServices: []
          })
          .mockResolvedValueOnce({
            id: 1,
            user: { id: 2, firstName: 'Luca', lastName: 'Moretti', email: 'x', role: 'DOCTOR', isActive: true },
            primarySpecialty: { id: 1, name: 'Cardiologia', isActive: true },
            medicalServices: [{ id: 1, specialtyId: 1, name: 'Visita', durationMinutes: 20, currentPrice: 50, isActive: true }]
          })
      },
      {},
      {},
      {
        findActiveByIds: vi.fn().mockResolvedValue([{ id: 1 }])
      },
      {
        replaceServices
      },
      { transaction: vi.fn() }
    );

    const result = await service.replaceServices(1, [1]);

    expect(replaceServices).toHaveBeenCalledWith(1, [1]);
    expect(result.medicalServices).toHaveLength(1);
  });
});
