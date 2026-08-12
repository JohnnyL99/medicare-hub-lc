import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError
} from '../errors/AppError.js';
import { doctorRepository } from '../repositories/DoctorRepository.js';
import { medicalServiceRepository } from '../repositories/MedicalServiceRepository.js';
import { specialtyRepository } from '../repositories/SpecialtyRepository.js';
import { USER_ROLES } from '../utils/constants.js';

const MEDICAL_SERVICE_SORT_FIELDS = [
  'name',
  'createdAt',
  'updatedAt',
  'isActive',
  'durationMinutes',
  'currentPrice'
];

export class MedicalServiceService {
  constructor(
    repository = medicalServiceRepository,
    specialties = specialtyRepository,
    doctors = doctorRepository
  ) {
    this.repository = repository;
    this.specialties = specialties;
    this.doctors = doctors;
  }

  async list(filters, actor) {
    const page = Number(filters.page || 1);
    const pageSize = Number(filters.pageSize || 20);
    const orderBy = MEDICAL_SERVICE_SORT_FIELDS.includes(filters.orderBy)
      ? filters.orderBy
      : 'name';
    const sortOrder = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';
    const isActive =
      filters.isActive === undefined ? undefined : filters.isActive === 'true';

    if (page < 1 || pageSize < 1 || pageSize > 100) {
      throw new BadRequestError('Parametri di paginazione non validi');
    }

    const doctorId = await this.resolveDoctorFilter(actor);
    const result = await this.repository.findPaginated({
      page,
      pageSize,
      name: filters.name?.trim(),
      isActive,
      orderBy,
      sortOrder,
      doctorId
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

  async getById(id, actor) {
    const doctorId = await this.resolveDoctorFilter(actor);
    const medicalService = await this.repository.findById(id, doctorId);

    if (!medicalService) {
      throw new NotFoundError('Prestazione medica non trovata');
    }

    return medicalService;
  }

  async create(payload) {
    await this.ensureSpecialtyExists(payload.specialtyId);
    await this.ensureUniqueName(payload.name, payload.specialtyId);

    return this.repository.create({
      specialtyId: payload.specialtyId,
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      durationMinutes: payload.durationMinutes,
      currentPrice: payload.currentPrice,
      isActive: payload.isActive ?? true
    });
  }

  async update(id, payload) {
    const medicalService = await this.getById(id, { role: USER_ROLES.ADMIN });

    await this.ensureSpecialtyExists(payload.specialtyId);
    await this.ensureUniqueName(payload.name, payload.specialtyId, medicalService.id);

    return this.repository.update(medicalService, {
      specialtyId: payload.specialtyId,
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      durationMinutes: payload.durationMinutes,
      currentPrice: payload.currentPrice,
      isActive: payload.isActive
    });
  }

  async updateStatus(id, isActive) {
    const medicalService = await this.getById(id, { role: USER_ROLES.ADMIN });

    return this.repository.update(medicalService, {
      isActive
    });
  }

  async ensureSpecialtyExists(specialtyId) {
    const specialty = await this.specialties.findById(specialtyId);

    if (!specialty) {
      throw new NotFoundError('Specializzazione non trovata');
    }
  }

  async ensureUniqueName(name, specialtyId, excludedId) {
    const existing = await this.repository.findByNameInSpecialty(
      name.trim(),
      specialtyId,
      excludedId
    );

    if (existing) {
      throw new ConflictError('Prestazione gia esistente per la specializzazione selezionata');
    }
  }

  async resolveDoctorFilter(actor) {
    if (actor.role !== USER_ROLES.DOCTOR) {
      return null;
    }

    const doctor = await this.doctors.findByUserId(Number(actor.sub));

    if (!doctor) {
      throw new ForbiddenError('Profilo medico non associato');
    }

    return doctor.id;
  }
}

export const medicalServiceService = new MedicalServiceService();
