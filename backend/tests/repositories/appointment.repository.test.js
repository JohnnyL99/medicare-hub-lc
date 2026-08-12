import { inspect } from 'node:util';
import { describe, expect, it, vi } from 'vitest';
import { AppointmentRepository } from '../../src/repositories/AppointmentRepository.js';

describe('AppointmentRepository', () => {
  it('builds search filters on joined appointment relations without nested dollar paths', async () => {
    const appointmentModel = {
      findAndCountAll: vi.fn().mockResolvedValue({
        rows: [],
        count: 0
      })
    };
    const repository = new AppointmentRepository(appointmentModel);

    await repository.findPaginated({
      page: 1,
      pageSize: 10,
      search: 'leo',
      orderBy: 'scheduledAt',
      sortOrder: 'ASC'
    });

    const query = appointmentModel.findAndCountAll.mock.calls[0][0];
    const serializedWhere = inspect(query.where, { depth: 10 });

    expect(serializedWhere).toContain('patient.first_name');
    expect(serializedWhere).toContain('doctor->user.first_name');
    expect(serializedWhere).toContain('medicalService.name');
    expect(serializedWhere).not.toContain('$patient.firstName$');
    expect(serializedWhere).not.toContain('$doctor.user.firstName$');
  });
});
