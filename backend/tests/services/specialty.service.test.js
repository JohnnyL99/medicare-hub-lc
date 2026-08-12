import { describe, expect, it, vi } from 'vitest';
import { ConflictError, NotFoundError } from '../../src/errors/AppError.js';
import { SpecialtyService } from '../../src/services/SpecialtyService.js';

describe('SpecialtyService', () => {
  it('returns paginated specialties', async () => {
    const repository = {
      findPaginated: vi.fn().mockResolvedValue({
        rows: [{ id: 1, name: 'Cardiologia' }],
        count: 1
      })
    };
    const service = new SpecialtyService(repository);

    const result = await service.list({});

    expect(result.data).toHaveLength(1);
    expect(result.meta).toEqual({
      page: 1,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1
    });
  });

  it('rejects duplicate specialty name on create', async () => {
    const repository = {
      findByName: vi.fn().mockResolvedValue({ id: 1, name: 'Cardiologia' })
    };
    const service = new SpecialtyService(repository);

    await expect(
      service.create({
        name: 'Cardiologia'
      })
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('fails when specialty does not exist', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue(null)
    };
    const service = new SpecialtyService(repository);

    await expect(service.getById(99)).rejects.toBeInstanceOf(NotFoundError);
  });
});
