import { sequelize } from '../config/database.js';
import {
  AppError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError
} from '../errors/AppError.js';
import { appointmentRepository } from '../repositories/AppointmentRepository.js';
import { availabilityRepository } from '../repositories/AvailabilityRepository.js';
import { doctorRepository } from '../repositories/DoctorRepository.js';
import { doctorServiceRepository } from '../repositories/DoctorServiceRepository.js';
import { medicalServiceRepository } from '../repositories/MedicalServiceRepository.js';
import { patientRepository } from '../repositories/PatientRepository.js';
import {
  addMinutes,
  clinicDateTimeToUtc,
  getClinicDateParts,
  getClinicNow,
  getClinicTimezone
} from '../utils/clinicDateTime.js';
import { APPOINTMENT_STATUSES, USER_ROLES } from '../utils/constants.js';

const APPOINTMENT_SORT_FIELDS = [
  'scheduledAt',
  'createdAt',
  'updatedAt',
  'status',
  'patientLastName',
  'doctorLastName',
  'medicalServiceName'
];

const FINAL_STATUSES = [
  APPOINTMENT_STATUSES.COMPLETED
];

const STATUS_TRANSITIONS = {
  [APPOINTMENT_STATUSES.SCHEDULED]: [
    APPOINTMENT_STATUSES.CONFIRMED,
    APPOINTMENT_STATUSES.CANCELLED
  ],
  [APPOINTMENT_STATUSES.CONFIRMED]: [
    APPOINTMENT_STATUSES.COMPLETED,
    APPOINTMENT_STATUSES.NO_SHOW,
    APPOINTMENT_STATUSES.CANCELLED
  ],
  [APPOINTMENT_STATUSES.COMPLETED]: [],
  [APPOINTMENT_STATUSES.CANCELLED]: [APPOINTMENT_STATUSES.SCHEDULED],
  [APPOINTMENT_STATUSES.NO_SHOW]: [APPOINTMENT_STATUSES.SCHEDULED]
};

export class AppointmentOverlapError extends AppError {
  constructor(message = 'Il medico ha gia un appuntamento nel periodo selezionato') {
    super({
      code: 'APPOINTMENT_OVERLAP',
      message,
      statusCode: 409,
      expose: true
    });
  }
}

export class OutsideDoctorAvailabilityError extends AppError {
  constructor(message = 'L appuntamento non rientra nella disponibilita del medico') {
    super({
      code: 'OUTSIDE_DOCTOR_AVAILABILITY',
      message,
      statusCode: 409,
      expose: true
    });
  }
}

export class DoctorServiceNotAllowedError extends AppError {
  constructor(message = 'Il medico non offre la prestazione selezionata') {
    super({
      code: 'DOCTOR_SERVICE_NOT_ALLOWED',
      message,
      statusCode: 409,
      expose: true
    });
  }
}

export class InvalidStatusTransitionError extends AppError {
  constructor(message = 'Transizione di stato non consentita') {
    super({
      code: 'INVALID_STATUS_TRANSITION',
      message,
      statusCode: 409,
      expose: true
    });
  }
}

export class AppointmentInThePastError extends AppError {
  constructor(message = 'Non e possibile pianificare o spostare un appuntamento nel passato') {
    super({
      code: 'APPOINTMENT_IN_THE_PAST',
      message,
      statusCode: 409,
      expose: true
    });
  }
}

export class ResourceNotActiveError extends AppError {
  constructor(message = 'La risorsa selezionata non e attiva') {
    super({
      code: 'RESOURCE_NOT_ACTIVE',
      message,
      statusCode: 409,
      expose: true
    });
  }
}

export class AppointmentService {
  constructor(
    appointments = appointmentRepository,
    patients = patientRepository,
    doctors = doctorRepository,
    medicalServices = medicalServiceRepository,
    doctorServices = doctorServiceRepository,
    availabilities = availabilityRepository,
    transactionProvider = sequelize
  ) {
    this.appointments = appointments;
    this.patients = patients;
    this.doctors = doctors;
    this.medicalServices = medicalServices;
    this.doctorServices = doctorServices;
    this.availabilities = availabilities;
    this.transactionProvider = transactionProvider;
  }

  async list(filters, actor) {
    const page = Number(filters.page || 1);
    const pageSize = Number(filters.pageSize || 20);
    const orderBy = APPOINTMENT_SORT_FIELDS.includes(filters.sortBy)
      ? filters.sortBy
      : 'scheduledAt';
    const sortOrder = filters.sortDirection === 'desc' ? 'DESC' : 'ASC';
    const scopedDoctorId = await this.resolveDoctorScope(actor);

    if (page < 1 || pageSize < 1 || pageSize > 100) {
      throw new BadRequestError('Parametri di paginazione non validi');
    }

    const result = await this.appointments.findPaginated({
      page,
      pageSize,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
      doctorId: filters.doctorId ? Number(filters.doctorId) : undefined,
      patientId: filters.patientId ? Number(filters.patientId) : undefined,
      medicalServiceId: filters.medicalServiceId ? Number(filters.medicalServiceId) : undefined,
      specialtyId: filters.specialtyId ? Number(filters.specialtyId) : undefined,
      status: filters.status,
      search: filters.search?.trim(),
      orderBy,
      sortOrder,
      scopedDoctorId
    });

    return {
      data: result.rows.map((appointment) => this.toPublicAppointment(appointment)),
      meta: {
        page,
        pageSize,
        totalItems: result.count,
        totalPages: Math.ceil(result.count / pageSize)
      }
    };
  }

  async getById(id, actor) {
    const appointment = await this.requireAppointment(id);
    await this.ensureReadAccess(appointment, actor);

    return this.toPublicAppointment(appointment);
  }

  async create(payload, actor) {
    this.ensureInternalScheduler(actor);

    return this.transactionProvider.transaction(async (transaction) => {
      const context = await this.prepareAppointmentContext(payload, transaction);
      const created = await this.appointments.create(
        {
          patientId: context.patient.id,
          doctorId: context.doctor.id,
          medicalServiceId: context.medicalService.id,
          scheduledAt: context.scheduledAt,
          endAt: context.endAt,
          durationMinutesSnapshot: context.medicalService.durationMinutes,
          priceSnapshot: context.medicalService.currentPrice,
          status: APPOINTMENT_STATUSES.SCHEDULED,
          operationalNotes: payload.operationalNotes?.trim() || null,
          createdBy: Number(actor.sub)
        },
        transaction
      );
      const appointment = await this.appointments.findById(created.id, transaction);

      return this.toPublicAppointment(appointment);
    });
  }

  async update(id, payload, actor) {
    const appointment = await this.requireAppointment(id);
    this.ensureNotCompletedForUpdate(appointment);

    if (actor.role === USER_ROLES.DOCTOR) {
      await this.ensureDoctorOwnsAppointment(appointment, actor);
      const updated = await this.appointments.update(
        appointment,
        {
          operationalNotes: payload.operationalNotes?.trim() || null
        }
      );

      return this.toPublicAppointment(updated);
    }

    this.ensureInternalScheduler(actor);

    return this.transactionProvider.transaction(async (transaction) => {
      const context = await this.prepareAppointmentContext(payload, transaction, appointment.id);
      const updatedEntity = await this.appointments.update(
        appointment,
        {
          patientId: context.patient.id,
          doctorId: context.doctor.id,
          medicalServiceId: context.medicalService.id,
          scheduledAt: context.scheduledAt,
          endAt: context.endAt,
          durationMinutesSnapshot: context.medicalService.durationMinutes,
          priceSnapshot: context.medicalService.currentPrice,
          operationalNotes: payload.operationalNotes?.trim() || null
        },
        transaction
      );
      const updated = await this.appointments.findById(updatedEntity.id, transaction);

      return this.toPublicAppointment(updated);
    });
  }

  async updateStatus(id, nextStatus, actor) {
    const appointment = await this.requireAppointment(id);

    if (actor.role === USER_ROLES.DOCTOR) {
      await this.ensureDoctorOwnsAppointment(appointment, actor);
      this.ensureDoctorStatusAllowed(nextStatus);
    } else {
      this.ensureInternalScheduler(actor);
    }

    this.ensureValidStatusTransition(appointment.status, nextStatus);
    const updated = await this.appointments.update(appointment, { status: nextStatus });

    return this.toPublicAppointment(updated);
  }

  async cancel(id, actor) {
    return this.updateStatus(id, APPOINTMENT_STATUSES.CANCELLED, actor);
  }

  async prepareAppointmentContext(payload, transaction, excludedId) {
    const patient = await this.requirePatient(payload.patientId);
    const doctor = await this.requireDoctor(payload.doctorId, transaction);
    const medicalService = await this.requireMedicalService(payload.medicalServiceId);
    const scheduledAt = new Date(payload.scheduledAt);
    const endAt = addMinutes(scheduledAt, medicalService.durationMinutes);

    this.ensureActive(patient, 'Paziente non attivo');
    this.ensureActive(doctor, 'Medico non attivo');
    this.ensureActive(medicalService, 'Prestazione non attiva');
    await this.ensureDoctorServiceAllowed(doctor.id, medicalService.id, transaction);
    this.ensureNotInPast(scheduledAt);
    await this.ensureInsideAvailability(doctor.id, scheduledAt, endAt, transaction);
    await this.ensureNoOverlap(doctor.id, scheduledAt, endAt, excludedId, transaction);

    return {
      patient,
      doctor,
      medicalService,
      scheduledAt,
      endAt
    };
  }

  async requireAppointment(id) {
    const appointment = await this.appointments.findById(id);

    if (!appointment) {
      throw new NotFoundError('Appuntamento non trovato');
    }

    return appointment;
  }

  async requirePatient(id) {
    const patient = await this.patients.findById(id);

    if (!patient) {
      throw new NotFoundError('Paziente non trovato');
    }

    return patient;
  }

  async requireDoctor(id, transaction) {
    const doctor = await this.doctors.findById(id, transaction);

    if (!doctor) {
      throw new NotFoundError('Medico non trovato');
    }

    return doctor;
  }

  async requireMedicalService(id) {
    const medicalService = await this.medicalServices.findById(id);

    if (!medicalService) {
      throw new NotFoundError('Prestazione non trovata');
    }

    return medicalService;
  }

  ensureInternalScheduler(actor) {
    if (![USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST].includes(actor.role)) {
      throw new ForbiddenError('Ruolo non autorizzato');
    }
  }

  async ensureReadAccess(appointment, actor) {
    if ([USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST].includes(actor.role)) {
      return;
    }

    await this.ensureDoctorOwnsAppointment(appointment, actor);
  }

  async ensureDoctorOwnsAppointment(appointment, actor) {
    const doctorId = await this.resolveDoctorScope(actor);

    if (doctorId !== appointment.doctorId) {
      throw new ForbiddenError('Appuntamento non accessibile');
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

  ensureActive(entity, message) {
    if (!entity.isActive) {
      throw new ResourceNotActiveError(message);
    }
  }

  async ensureDoctorServiceAllowed(doctorId, medicalServiceId, transaction) {
    const exists = await this.doctorServices.exists(doctorId, medicalServiceId, transaction);

    if (!exists) {
      throw new DoctorServiceNotAllowedError();
    }
  }

  ensureNotInPast(scheduledAt) {
    const now = getClinicNow().dateTime;

    if (scheduledAt <= now) {
      throw new AppointmentInThePastError();
    }
  }

  async ensureInsideAvailability(doctorId, scheduledAt, endAt, transaction) {
    const clinicParts = getClinicDateParts(scheduledAt);
    const availabilities = await this.availabilities.findActiveByDoctorAndWeekday(
      doctorId,
      clinicParts.weekday,
      transaction
    );

    if (!availabilities.length) {
      throw new OutsideDoctorAvailabilityError();
    }

    const fits = availabilities.some((availability) => {
      const startBoundary = clinicDateTimeToUtc(clinicParts.date, availability.startTime);
      const endBoundary = clinicDateTimeToUtc(clinicParts.date, availability.endTime);

      return scheduledAt >= startBoundary && endAt <= endBoundary;
    });

    if (!fits) {
      throw new OutsideDoctorAvailabilityError();
    }
  }

  async ensureNoOverlap(doctorId, scheduledAt, endAt, excludedId, transaction) {
    const overlap = await this.appointments.findOverlap(
      {
        doctorId,
        scheduledAt,
        endAt,
        excludedId,
        transaction
      }
    );

    if (overlap) {
      throw new AppointmentOverlapError();
    }
  }

  ensureValidStatusTransition(currentStatus, nextStatus) {
    if (currentStatus === nextStatus) {
      return;
    }

    if (FINAL_STATUSES.includes(currentStatus)) {
      throw new InvalidStatusTransitionError('Gli stati finali sono immutabili');
    }

    const allowed = STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(nextStatus)) {
      throw new InvalidStatusTransitionError();
    }
  }

  ensureDoctorStatusAllowed(nextStatus) {
    const allowed = [
      APPOINTMENT_STATUSES.CONFIRMED,
      APPOINTMENT_STATUSES.COMPLETED,
      APPOINTMENT_STATUSES.NO_SHOW
    ];

    if (!allowed.includes(nextStatus)) {
      throw new ForbiddenError('Ruolo non autorizzato');
    }
  }

  ensureNotCompletedForUpdate(appointment) {
    if (appointment.status === APPOINTMENT_STATUSES.COMPLETED) {
      throw new ConflictError('Un appuntamento completato non puo piu essere modificato');
    }
  }

  toPublicAppointment(appointment) {
    return {
      id: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      medicalServiceId: appointment.medicalServiceId,
      scheduledAt: appointment.scheduledAt,
      endAt: appointment.endAt,
      durationMinutesSnapshot: appointment.durationMinutesSnapshot,
      priceSnapshot: appointment.priceSnapshot,
      status: appointment.status,
      operationalNotes: appointment.operationalNotes,
      createdBy: appointment.createdBy,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      timezone: getClinicTimezone(),
      patient: appointment.patient
        ? {
            id: appointment.patient.id,
            firstName: appointment.patient.firstName,
            lastName: appointment.patient.lastName,
            birthDate: appointment.patient.birthDate,
            email: appointment.patient.email,
            phone: appointment.patient.phone,
            fiscalCode: appointment.patient.fiscalCode,
            isActive: appointment.patient.isActive
          }
        : undefined,
      doctor: appointment.doctor
        ? {
            id: appointment.doctor.id,
            specialtyId: appointment.doctor.specialtyId,
            licenseNumber: appointment.doctor.licenseNumber,
            isActive: appointment.doctor.isActive,
            user: appointment.doctor.user
              ? {
                  id: appointment.doctor.user.id,
                  firstName: appointment.doctor.user.firstName,
                  lastName: appointment.doctor.user.lastName,
                  email: appointment.doctor.user.email,
                  role: appointment.doctor.user.role,
                  isActive: appointment.doctor.user.isActive
                }
              : undefined,
            specialty: appointment.doctor.primarySpecialty
              ? {
                  id: appointment.doctor.primarySpecialty.id,
                  name: appointment.doctor.primarySpecialty.name,
                  isActive: appointment.doctor.primarySpecialty.isActive
                }
              : undefined
          }
        : undefined,
      medicalService: appointment.medicalService
        ? {
            id: appointment.medicalService.id,
            specialtyId: appointment.medicalService.specialtyId,
            name: appointment.medicalService.name,
            durationMinutes: appointment.medicalService.durationMinutes,
            currentPrice: appointment.medicalService.currentPrice,
            isActive: appointment.medicalService.isActive,
            specialty: appointment.medicalService.specialty
              ? {
                  id: appointment.medicalService.specialty.id,
                  name: appointment.medicalService.specialty.name,
                  isActive: appointment.medicalService.specialty.isActive
                }
              : undefined
          }
        : undefined,
      creator: appointment.creator
        ? {
            id: appointment.creator.id,
            firstName: appointment.creator.firstName,
            lastName: appointment.creator.lastName,
            email: appointment.creator.email,
            role: appointment.creator.role
          }
        : undefined
    };
  }
}

export const appointmentService = new AppointmentService();
