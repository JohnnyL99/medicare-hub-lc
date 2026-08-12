import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError
} from '../errors/AppError.js';
import { doctorRepository } from '../repositories/DoctorRepository.js';
import { patientRepository } from '../repositories/PatientRepository.js';
import { USER_ROLES } from '../utils/constants.js';

const PATIENT_SORT_FIELDS = ['firstName', 'lastName', 'email', 'birthDate', 'createdAt', 'isActive'];

export class PatientService {
  constructor(repository = patientRepository, doctors = doctorRepository) {
    this.repository = repository;
    this.doctors = doctors;
  }

  async list(filters, actor) {
    const page = Number(filters.page || 1);
    const pageSize = Number(filters.pageSize || 20);
    const orderBy = PATIENT_SORT_FIELDS.includes(filters.orderBy)
      ? filters.orderBy
      : 'lastName';
    const sortOrder = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';
    const isActive =
      filters.isActive === undefined ? undefined : filters.isActive === 'true';
    const doctorId = await this.resolveDoctorScope(actor);

    if (page < 1 || pageSize < 1 || pageSize > 100) {
      throw new BadRequestError('Parametri di paginazione non validi');
    }

    const result = await this.repository.findPaginated({
      page,
      pageSize,
      search: filters.search?.trim(),
      isActive,
      orderBy,
      sortOrder,
      doctorId
    });

    return {
      data: result.rows.map((patient) => this.toPublicPatient(patient)),
      meta: {
        page,
        pageSize,
        totalItems: result.count,
        totalPages: Math.ceil(result.count / pageSize)
      }
    };
  }

  async getById(id, actor) {
    const patient = await this.repository.findById(id);

    if (!patient) {
      throw new NotFoundError('Paziente non trovato');
    }

    if (actor.role === USER_ROLES.DOCTOR) {
      const doctorId = await this.resolveDoctorScope(actor);
      const linked = await this.repository.isLinkedToDoctor(patient.id, doctorId);

      if (!linked) {
        throw new ForbiddenError('Paziente non accessibile');
      }
    }

    return this.toPublicPatient(patient);
  }

  async create(payload) {
    await this.ensureUniqueFiscalCode(payload.fiscalCode);

    const patient = await this.repository.create(this.normalizePayload(payload));

    return this.toPublicPatient(patient);
  }

  async update(id, payload) {
    const patient = await this.requireEntity(id);
    await this.ensureUniqueFiscalCode(payload.fiscalCode, patient.id);
    const updated = await this.repository.update(patient, this.normalizePayload(payload));

    return this.toPublicPatient(updated);
  }

  async updateStatus(id, isActive) {
    const patient = await this.requireEntity(id);
    const updated = await this.repository.update(patient, { isActive });

    return this.toPublicPatient(updated);
  }

  async requireEntity(id) {
    const patient = await this.repository.findById(id);

    if (!patient) {
      throw new NotFoundError('Paziente non trovato');
    }

    return patient;
  }

  async ensureUniqueFiscalCode(fiscalCode, excludedId) {
    if (!fiscalCode) {
      return;
    }

    const existing = await this.repository.findByFiscalCode(
      fiscalCode.trim().toUpperCase(),
      excludedId
    );

    if (existing) {
      throw new ConflictError('Codice fiscale fittizio gia esistente');
    }
  }

  async resolveDoctorScope(actor) {
    if (actor.role !== USER_ROLES.DOCTOR) {
      return null;
    }

    const doctor = await this.doctors.findByUserId(Number(actor.sub));

    if (!doctor) {
      throw new ForbiddenError('Profilo medico non associato');
    }

    return doctor.id;
  }

  normalizePayload(payload) {
    return {
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      birthDate: payload.birthDate,
      email: payload.email ? payload.email.trim().toLowerCase() : null,
      phone: payload.phone.trim(),
      fiscalCode: payload.fiscalCode ? payload.fiscalCode.trim().toUpperCase() : null,
      isActive: payload.isActive ?? true
    };
  }

  toPublicPatient(patient) {
    return {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      birthDate: patient.birthDate,
      email: patient.email,
      phone: patient.phone,
      fiscalCode: patient.fiscalCode,
      isActive: patient.isActive,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt
    };
  }
}

export const patientService = new PatientService();
