import { sequelize } from '../config/database.js';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError
} from '../errors/AppError.js';
import { doctorRepository } from '../repositories/DoctorRepository.js';
import { doctorServiceRepository } from '../repositories/DoctorServiceRepository.js';
import { medicalServiceRepository } from '../repositories/MedicalServiceRepository.js';
import { specialtyRepository } from '../repositories/SpecialtyRepository.js';
import { userRepository } from '../repositories/UserRepository.js';
import { USER_ROLES } from '../utils/constants.js';

const DOCTOR_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'isActive',
  'licenseNumber',
  'specialtyId',
  'lastName'
];

export class DoctorAdminService {
  constructor(
    doctors = doctorRepository,
    users = userRepository,
    specialties = specialtyRepository,
    medicalServices = medicalServiceRepository,
    doctorServices = doctorServiceRepository,
    transactionProvider = sequelize
  ) {
    this.doctors = doctors;
    this.users = users;
    this.specialties = specialties;
    this.medicalServices = medicalServices;
    this.doctorServices = doctorServices;
    this.transactionProvider = transactionProvider;
  }

  async list(filters) {
    const page = Number(filters.page || 1);
    const pageSize = Number(filters.pageSize || 20);
    const orderBy = DOCTOR_SORT_FIELDS.includes(filters.orderBy)
      ? filters.orderBy
      : 'lastName';
    const sortOrder = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';
    const isActive =
      filters.isActive === undefined ? undefined : filters.isActive === 'true';
    const specialtyId = filters.specialtyId ? Number(filters.specialtyId) : undefined;

    if (page < 1 || pageSize < 1 || pageSize > 100) {
      throw new BadRequestError('Parametri di paginazione non validi');
    }

    const result = await this.doctors.findPaginated({
      page,
      pageSize,
      name: filters.name?.trim(),
      specialtyId,
      isActive,
      orderBy,
      sortOrder
    });

    return {
      data: result.rows.map((doctor) => this.toPublicDoctor(doctor)),
      meta: {
        page,
        pageSize,
        totalItems: result.count,
        totalPages: Math.ceil(result.count / pageSize)
      }
    };
  }

  async getById(id, actor = null) {
    await this.assertDoctorOwnership(id, actor);
    const doctor = await this.requireEntity(id);

    return this.toPublicDoctor(doctor);
  }

  async create(payload) {
    return this.transactionProvider.transaction(async (transaction) => {
      await this.ensureUniqueEmail(payload.email, undefined, transaction);
      await this.ensureSpecialtyExists(payload.specialtyId);
      await this.ensureUniqueLicenseNumber(payload.licenseNumber, undefined, transaction);
      const activeServices = await this.validateActiveServices(
        payload.medicalServiceIds || [],
        transaction
      );

      const user = await this.users.create(
        {
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          email: payload.email.trim().toLowerCase(),
          passwordHash: payload.passwordHash,
          role: USER_ROLES.DOCTOR,
          isActive: payload.isActive ?? true
        },
        transaction
      );

      const doctor = await this.doctors.create(
        {
          userId: user.id,
          specialtyId: payload.specialtyId,
          licenseNumber: payload.licenseNumber.trim(),
          biography: payload.biography?.trim() || null,
          isActive: payload.isActive ?? true
        },
        transaction
      );

      await this.doctorServices.replaceServices(
        doctor.id,
        activeServices.map((service) => service.id),
        transaction
      );

      const created = await this.doctors.findById(doctor.id, transaction);

      return this.toPublicDoctor(created);
    });
  }

  async update(id, payload) {
    const doctor = await this.requireEntity(id);
    await this.ensureSpecialtyExists(payload.specialtyId);
    await this.ensureUniqueLicenseNumber(payload.licenseNumber, doctor.id);
    await this.ensureUniqueEmail(payload.email, doctor.user.id);

    return this.transactionProvider.transaction(async (transaction) => {
      await this.users.update(
        doctor.user,
        {
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          email: payload.email.trim().toLowerCase(),
          role: USER_ROLES.DOCTOR,
          isActive: payload.isActive
        },
        transaction
      );

      await this.doctors.update(
        doctor,
        {
          specialtyId: payload.specialtyId,
          licenseNumber: payload.licenseNumber.trim(),
          biography: payload.biography?.trim() || null,
          isActive: payload.isActive
        },
        transaction
      );

      const updated = await this.doctors.findById(doctor.id, transaction);

      return this.toPublicDoctor(updated);
    });
  }

  async updateStatus(id, isActive) {
    const doctor = await this.requireEntity(id);

    return this.transactionProvider.transaction(async (transaction) => {
      await this.users.update(doctor.user, { isActive }, transaction);
      await this.doctors.update(doctor, { isActive }, transaction);
      const updated = await this.doctors.findById(doctor.id, transaction);

      return this.toPublicDoctor(updated);
    });
  }

  async replaceServices(id, medicalServiceIds, actor = null) {
    await this.assertDoctorOwnership(id, actor);
    const doctor = await this.requireEntity(id);
    const activeServices = await this.validateActiveServices(medicalServiceIds);

    await this.doctorServices.replaceServices(
      doctor.id,
      activeServices.map((service) => service.id)
    );

    const updated = await this.doctors.findById(doctor.id);

    return this.toPublicDoctor(updated);
  }

  async getCurrentDoctor(userId) {
    const doctor = await this.doctors.findByUserId(Number(userId));

    if (!doctor) {
      throw new ForbiddenError('Profilo medico non associato');
    }

    const hydratedDoctor = await this.requireEntity(doctor.id);

    return this.toPublicDoctor(hydratedDoctor);
  }

  async listAssignableServices(userId) {
    await this.getCurrentDoctor(userId);
    const services = await this.medicalServices.findAllActive();

    return services.map((service) => ({
      id: service.id,
      specialtyId: service.specialtyId,
      name: service.name,
      description: service.description,
      durationMinutes: service.durationMinutes,
      currentPrice: service.currentPrice,
      isActive: service.isActive,
      specialty: service.specialty
        ? {
            id: service.specialty.id,
            name: service.specialty.name,
            isActive: service.specialty.isActive
          }
        : null
    }));
  }

  async requireEntity(id) {
    const doctor = await this.doctors.findById(id);

    if (!doctor) {
      throw new NotFoundError('Medico non trovato');
    }

    return doctor;
  }

  async ensureSpecialtyExists(specialtyId) {
    const specialty = await this.specialties.findById(specialtyId);

    if (!specialty) {
      throw new NotFoundError('Specializzazione non trovata');
    }
  }

  async ensureUniqueEmail(email, excludedId, transaction) {
    const existing = await this.users.findByEmail(
      email.trim().toLowerCase(),
      excludedId,
      transaction
    );

    if (existing) {
      throw new ConflictError('Email gia esistente');
    }
  }

  async ensureUniqueLicenseNumber(licenseNumber, excludedId, transaction) {
    const existing = await this.doctors.findByLicenseNumber(
      licenseNumber.trim(),
      excludedId,
      transaction
    );

    if (existing) {
      throw new ConflictError('Numero licenza gia esistente');
    }
  }

  async validateActiveServices(medicalServiceIds, transaction) {
    const ids = [...new Set(medicalServiceIds || [])];

    if (!ids.length) {
      return [];
    }

    const services = await this.medicalServices.findActiveByIds(ids, undefined, transaction);

    if (services.length !== ids.length) {
      throw new BadRequestError('Tutte le prestazioni assegnate devono essere attive');
    }

    return services;
  }

  async assertDoctorOwnership(id, actor) {
    if (!actor || actor.role !== USER_ROLES.DOCTOR) {
      return;
    }

    const doctor = await this.doctors.findByUserId(Number(actor.sub));

    if (!doctor) {
      throw new ForbiddenError('Profilo medico non associato');
    }

    if (doctor.id !== Number(id)) {
      throw new ForbiddenError('Medico non autorizzato');
    }
  }

  toPublicDoctor(doctor) {
    return {
      id: doctor.id,
      licenseNumber: doctor.licenseNumber,
      biography: doctor.biography,
      isActive: doctor.isActive,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt,
      user: doctor.user
        ? {
            id: doctor.user.id,
            firstName: doctor.user.firstName,
            lastName: doctor.user.lastName,
            email: doctor.user.email,
            role: doctor.user.role,
            isActive: doctor.user.isActive
          }
        : null,
      specialty: doctor.primarySpecialty
        ? {
            id: doctor.primarySpecialty.id,
            name: doctor.primarySpecialty.name,
            isActive: doctor.primarySpecialty.isActive
          }
        : null,
      medicalServices: Array.isArray(doctor.medicalServices)
        ? doctor.medicalServices.map((service) => ({
            id: service.id,
            specialtyId: service.specialtyId,
            name: service.name,
            durationMinutes: service.durationMinutes,
            currentPrice: service.currentPrice,
            isActive: service.isActive
          }))
        : []
    };
  }
}

export const doctorAdminService = new DoctorAdminService();
