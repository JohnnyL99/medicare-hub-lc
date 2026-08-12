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
import {
  addMinutes,
  clinicDateTimeToUtc,
  formatTime,
  getClinicNow,
  getClinicTimezone,
  getIsoWeekday
} from '../utils/clinicDateTime.js';
import { USER_ROLES } from '../utils/constants.js';

export class AvailabilityOverlapError extends AppError {
  constructor(message = 'Disponibilita sovrapposta per il medico selezionato') {
    super({
      code: 'AVAILABILITY_OVERLAP',
      message,
      statusCode: 409,
      expose: true
    });
  }
}

export class AvailabilityService {
  constructor(
    availabilities = availabilityRepository,
    doctors = doctorRepository,
    medicalServices = medicalServiceRepository,
    doctorServices = doctorServiceRepository,
    appointments = appointmentRepository,
    transactionProvider = sequelize
  ) {
    this.availabilities = availabilities;
    this.doctors = doctors;
    this.medicalServices = medicalServices;
    this.doctorServices = doctorServices;
    this.appointments = appointments;
    this.transactionProvider = transactionProvider;
  }

  async listByDoctor(doctorId, actor) {
    await this.ensureReadAccess(doctorId, actor);
    await this.requireDoctor(doctorId);
    const availabilities = await this.availabilities.findByDoctorId(doctorId);

    return availabilities.map((availability) => this.toPublicAvailability(availability));
  }

  async createForDoctor(doctorId, payload, actor) {
    await this.ensureManageAccess(doctorId, actor);
    await this.requireDoctor(doctorId);
    const normalized = this.normalizePayload(payload, doctorId);

    return this.transactionProvider.transaction(async (transaction) => {
      await this.ensureNoOverlap(normalized, undefined, transaction);
      const created = await this.availabilities.create(normalized, transaction);

      return this.toPublicAvailability(created);
    });
  }

  async update(id, payload, actor) {
    const availability = await this.requireAvailability(id);
    await this.ensureManageAccess(availability.doctorId, actor);
    const normalized = this.normalizePayload(payload, availability.doctorId);

    return this.transactionProvider.transaction(async (transaction) => {
      await this.ensureNoOverlap(normalized, availability.id, transaction);
      const updated = await this.availabilities.update(availability, normalized, transaction);

      return this.toPublicAvailability(updated);
    });
  }

  async delete(id, actor) {
    const availability = await this.requireAvailability(id);
    await this.ensureManageAccess(availability.doctorId, actor);

    await this.transactionProvider.transaction(async (transaction) => {
      await this.availabilities.destroy(availability, transaction);
    });

    return {
      id,
      deleted: true
    };
  }

  async getAvailableSlots(doctorId, filters, actor) {
    await this.ensureReadAccess(doctorId, actor);
    const doctor = await this.requireDoctor(doctorId);

    if (!doctor.isActive) {
      throw new ConflictError('Il medico selezionato non e disponibile');
    }

    const medicalService = await this.medicalServices.findById(filters.medicalServiceId);

    if (!medicalService) {
      throw new NotFoundError('Prestazione non trovata');
    }

    if (!medicalService.isActive) {
      throw new BadRequestError('Prestazione non attiva o non associata al medico');
    }

    const linked = await this.doctorServices.exists(doctorId, medicalService.id);

    if (!linked) {
      throw new BadRequestError('Prestazione non attiva o non associata al medico');
    }

    const weekday = getIsoWeekday(filters.date);
    const availabilities = await this.availabilities.findActiveByDoctorAndWeekday(
      doctorId,
      weekday
    );

    if (!availabilities.length) {
      return this.buildSlotsResponse(filters.date, medicalService, []);
    }

    const dayStart = clinicDateTimeToUtc(filters.date, '00:00:00');
    const dayEnd = clinicDateTimeToUtc(filters.date, '23:59:59');
    const appointments = await this.appointments.findNonCancelledByDoctorBetween(
      doctorId,
      dayStart,
      dayEnd
    );
    const slots = this.computeSlots(filters.date, medicalService.durationMinutes, availabilities, appointments);

    return this.buildSlotsResponse(filters.date, medicalService, slots);
  }

  async requireDoctor(id) {
    const doctor = await this.doctors.findById(id);

    if (!doctor) {
      throw new NotFoundError('Medico non trovato');
    }

    return doctor;
  }

  async requireAvailability(id) {
    const availability = await this.availabilities.findById(id);

    if (!availability) {
      throw new NotFoundError('Disponibilita non trovata');
    }

    return availability;
  }

  async ensureReadAccess(doctorId, actor) {
    if ([USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST].includes(actor.role)) {
      return;
    }

    if (actor.role !== USER_ROLES.DOCTOR) {
      throw new ForbiddenError('Ruolo non autorizzato');
    }

    const scopedDoctorId = await this.resolveActorDoctorId(actor);

    if (scopedDoctorId !== doctorId) {
      throw new ForbiddenError('Disponibilita non accessibile');
    }
  }

  async ensureManageAccess(doctorId, actor) {
    if (actor.role === USER_ROLES.ADMIN) {
      return;
    }

    if (actor.role !== USER_ROLES.DOCTOR) {
      throw new ForbiddenError('Ruolo non autorizzato');
    }

    const scopedDoctorId = await this.resolveActorDoctorId(actor);

    if (scopedDoctorId !== doctorId) {
      throw new ForbiddenError('Disponibilita non accessibile');
    }
  }

  async resolveActorDoctorId(actor) {
    const doctor = await this.doctors.findByUserId(Number(actor.sub));

    if (!doctor) {
      throw new ForbiddenError('Profilo medico non associato');
    }

    return doctor.id;
  }

  async ensureNoOverlap(payload, excludedId, transaction) {
    const overlapping = await this.availabilities.findOverlapping(
      {
        doctorId: payload.doctorId,
        weekday: payload.weekday,
        startTime: payload.startTime,
        endTime: payload.endTime,
        excludedId
      },
      transaction
    );

    if (overlapping) {
      throw new AvailabilityOverlapError();
    }
  }

  normalizePayload(payload, doctorId) {
    if (payload.startTime >= payload.endTime) {
      throw new BadRequestError('startTime deve essere minore di endTime');
    }

    return {
      doctorId,
      weekday: payload.weekday,
      startTime: payload.startTime,
      endTime: payload.endTime,
      isActive: payload.isActive ?? true
    };
  }

  computeSlots(date, durationMinutes, availabilities, appointments) {
    const { date: clinicToday, time: clinicNowTime, dateTime: nowUtc } = getClinicNow();
    const slots = [];

    for (const availability of availabilities) {
      let cursor = clinicDateTimeToUtc(date, availability.startTime);
      const availabilityEnd = clinicDateTimeToUtc(date, availability.endTime);

      while (addMinutes(cursor, durationMinutes) <= availabilityEnd) {
        const slotEnd = addMinutes(cursor, durationMinutes);
        const slotLocalTime = formatTime(cursor);
        const isPastDay = date < clinicToday;
        const isPastTimeToday = date === clinicToday && slotLocalTime <= clinicNowTime;
        const overlaps = appointments.some(
          (appointment) => cursor < appointment.endAt && slotEnd > appointment.scheduledAt
        );

        if (!isPastDay && !isPastTimeToday && cursor >= nowUtc && !overlaps) {
          slots.push({
            startAt: cursor.toISOString(),
            endAt: slotEnd.toISOString(),
            startTime: slotLocalTime,
            endTime: formatTime(slotEnd)
          });
        }

        cursor = slotEnd;
      }
    }

    return slots;
  }

  buildSlotsResponse(date, medicalService, slots) {
    return {
      date,
      timezone: getClinicTimezone(),
      medicalService: {
        id: medicalService.id,
        name: medicalService.name,
        durationMinutes: medicalService.durationMinutes
      },
      slots
    };
  }

  toPublicAvailability(availability) {
    return {
      id: availability.id,
      doctorId: availability.doctorId,
      weekday: availability.weekday,
      startTime: availability.startTime,
      endTime: availability.endTime,
      isActive: availability.isActive,
      createdAt: availability.createdAt,
      updatedAt: availability.updatedAt
    };
  }
}

export const availabilityService = new AvailabilityService();
