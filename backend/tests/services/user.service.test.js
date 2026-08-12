import { describe, expect, it, vi } from 'vitest';
import { ConflictError } from '../../src/errors/AppError.js';
import { UserService } from '../../src/services/UserService.js';

describe('UserService', () => {
  it('rejects duplicate email on create', async () => {
    const repository = {
      findByEmail: vi.fn().mockResolvedValue({ id: 1 })
    };
    const service = new UserService(repository);

    await expect(
      service.create({
        firstName: 'Aurora',
        lastName: 'Admin',
        email: 'admin@aurora.test',
        password: 'Demo123!',
        role: 'ADMIN'
      })
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('does not expose password hash in public response', async () => {
    const repository = {
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: 10,
        firstName: 'Giulia',
        lastName: 'Rossi',
        email: 'giulia.rossi@aurora.test',
        role: 'RECEPTIONIST',
        isActive: true,
        passwordHash: 'hashed-secret',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    };
    const service = new UserService(repository);

    const result = await service.create({
      firstName: 'Giulia',
      lastName: 'Rossi',
      email: 'giulia.rossi@aurora.test',
      password: 'Demo123!',
      role: 'RECEPTIONIST'
    });

    expect(result.passwordHash).toBeUndefined();
    expect(result.email).toBe('giulia.rossi@aurora.test');
  });
});
