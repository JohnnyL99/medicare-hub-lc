import { describe, expect, it, vi } from 'vitest';
import { DoctorRepository } from '../../src/repositories/DoctorRepository.js';

describe('DoctorRepository', () => {
  it('includes associated medical services in paginated doctor lists', async () => {
    const doctorModel = {
      findAndCountAll: vi.fn().mockResolvedValue({
        rows: [],
        count: 0
      })
    };
    const repository = new DoctorRepository(doctorModel);

    await repository.findPaginated({
      page: 1,
      pageSize: 10,
      orderBy: 'lastName',
      sortOrder: 'ASC'
    });

    const query = doctorModel.findAndCountAll.mock.calls[0][0];
    const medicalServicesInclude = query.include.find((include) => include.as === 'medicalServices');

    expect(medicalServicesInclude).toBeTruthy();
    expect(medicalServicesInclude.attributes).toContain('id');
    expect(medicalServicesInclude.through).toEqual({ attributes: [] });
  });
});
