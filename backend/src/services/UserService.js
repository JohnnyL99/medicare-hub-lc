import bcrypt from 'bcryptjs';
import {
  BadRequestError,
  ConflictError,
  NotFoundError
} from '../errors/AppError.js';
import { userRepository } from '../repositories/UserRepository.js';
import { USER_ROLES } from '../utils/constants.js';

const USER_SORT_FIELDS = ['firstName', 'lastName', 'email', 'role', 'createdAt', 'isActive'];

export class UserService {
  constructor(repository = userRepository) {
    this.repository = repository;
  }

  async list(filters) {
    const page = Number(filters.page || 1);
    const pageSize = Number(filters.pageSize || 20);
    const orderBy = USER_SORT_FIELDS.includes(filters.orderBy)
      ? filters.orderBy
      : 'lastName';
    const sortOrder = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';
    const isActive =
      filters.isActive === undefined ? undefined : filters.isActive === 'true';
    const role = Object.values(USER_ROLES).includes(filters.role) ? filters.role : undefined;

    if (page < 1 || pageSize < 1 || pageSize > 100) {
      throw new BadRequestError('Parametri di paginazione non validi');
    }

    const result = await this.repository.findPaginated({
      page,
      pageSize,
      name: filters.name?.trim(),
      isActive,
      role,
      orderBy,
      sortOrder
    });

    return {
      data: result.rows.map((user) => this.toPublicUser(user)),
      meta: {
        page,
        pageSize,
        totalItems: result.count,
        totalPages: Math.ceil(result.count / pageSize)
      }
    };
  }

  async getById(id) {
    const user = await this.requireEntity(id);

    return this.toPublicUser(user);
  }

  async create(payload) {
    await this.ensureUniqueEmail(payload.email);

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await this.repository.create({
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      email: payload.email.trim().toLowerCase(),
      passwordHash,
      role: payload.role,
      isActive: payload.isActive ?? true
    });

    return this.toPublicUser(user);
  }

  async update(id, payload, transaction) {
    const user = await this.requireEntity(id);
    await this.ensureUniqueEmail(payload.email, user.id, transaction);

    if (user.doctorProfile && payload.role !== USER_ROLES.DOCTOR) {
      throw new BadRequestError('Un utente collegato a un medico deve mantenere ruolo DOCTOR');
    }

    const updated = await this.repository.update(
      user,
      {
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        email: payload.email.trim().toLowerCase(),
        role: payload.role,
        isActive: payload.isActive
      },
      transaction
    );

    return this.toPublicUser(updated);
  }

  async updateStatus(id, isActive) {
    const user = await this.requireEntity(id);
    const updated = await this.repository.update(user, { isActive });

    return this.toPublicUser(updated);
  }

  async updatePassword(id, password) {
    const user = await this.requireEntity(id);
    const passwordHash = await bcrypt.hash(password, 10);
    await this.repository.update(user, { passwordHash });

    return {
      updated: true
    };
  }

  async requireEntity(id) {
    const user = await this.repository.findById(id);

    if (!user) {
      throw new NotFoundError('Utente non trovato');
    }

    return user;
  }

  async ensureUniqueEmail(email, excludedId, transaction) {
    const existing = await this.repository.findByEmail(
      email.trim().toLowerCase(),
      excludedId,
      transaction
    );

    if (existing) {
      throw new ConflictError('Email gia esistente');
    }
  }

  toPublicUser(user) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}

export const userService = new UserService();
