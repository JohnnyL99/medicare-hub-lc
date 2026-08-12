import {
  BadRequestError,
  ConflictError,
  NotFoundError
} from '../errors/AppError.js';
import { specialtyRepository } from '../repositories/SpecialtyRepository.js';

const SPECIALTY_SORT_FIELDS = ['name', 'createdAt', 'updatedAt', 'isActive'];

export class SpecialtyService {
  constructor(repository = specialtyRepository) {
    this.repository = repository;
  }

  async list(filters) {
    const page = Number(filters.page || 1);
    const pageSize = Number(filters.pageSize || 20);
    const orderBy = SPECIALTY_SORT_FIELDS.includes(filters.orderBy)
      ? filters.orderBy
      : 'name';
    const sortOrder = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';
    const isActive =
      filters.isActive === undefined ? undefined : filters.isActive === 'true';

    if (page < 1 || pageSize < 1 || pageSize > 100) {
      throw new BadRequestError('Parametri di paginazione non validi');
    }

    const result = await this.repository.findPaginated({
      page,
      pageSize,
      name: filters.name?.trim(),
      isActive,
      orderBy,
      sortOrder
    });

    return {
      data: result.rows,
      meta: {
        page,
        pageSize,
        totalItems: result.count,
        totalPages: Math.ceil(result.count / pageSize)
      }
    };
  }

  async getById(id) {
    const specialty = await this.repository.findById(id);

    if (!specialty) {
      throw new NotFoundError('Specializzazione non trovata');
    }

    return specialty;
  }

  async create(payload) {
    const existing = await this.repository.findByName(payload.name.trim());

    if (existing) {
      throw new ConflictError('Nome specializzazione gia esistente');
    }

    return this.repository.create({
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      isActive: payload.isActive ?? true
    });
  }

  async update(id, payload) {
    const specialty = await this.getById(id);
    const normalizedName = payload.name.trim();

    if (specialty.name !== normalizedName) {
      const existing = await this.repository.findByName(normalizedName);

      if (existing && existing.id !== specialty.id) {
        throw new ConflictError('Nome specializzazione gia esistente');
      }
    }

    return this.repository.update(specialty, {
      name: normalizedName,
      description: payload.description?.trim() || null,
      isActive: payload.isActive
    });
  }

  async updateStatus(id, isActive) {
    const specialty = await this.getById(id);

    return this.repository.update(specialty, {
      isActive
    });
  }
}

export const specialtyService = new SpecialtyService();
