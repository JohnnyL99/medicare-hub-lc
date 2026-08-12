import { BadRequestError, ForbiddenError } from '../errors/AppError.js';
import { dashboardRepository } from '../repositories/DashboardRepository.js';
import { doctorRepository } from '../repositories/DoctorRepository.js';
import { getClinicNow, getClinicTimezone } from '../utils/clinicDateTime.js';
import { USER_ROLES } from '../utils/constants.js';

export class DashboardService {
  constructor(repository = dashboardRepository, doctors = doctorRepository) {
    this.repository = repository;
    this.doctors = doctors;
  }

  async getSummary(filters, actor) {
    const scopedFilters = await this.normalizeFilters(filters, actor);
    const summary = await this.repository.getSummary(scopedFilters);

    return {
      totalAppointments: Number(summary.totalAppointments || 0),
      scheduledAppointments: Number(summary.scheduledAppointments || 0),
      confirmedAppointments: Number(summary.confirmedAppointments || 0),
      completedAppointments: Number(summary.completedAppointments || 0),
      cancelledAppointments: Number(summary.cancelledAppointments || 0),
      noShowAppointments: Number(summary.noShowAppointments || 0),
      activePatients: Number(summary.activePatients || 0),
      theoreticalRevenue: Number(summary.theoreticalRevenue || 0)
    };
  }

  async getAppointmentsTrend(filters, actor) {
    const scopedFilters = await this.normalizeFilters(filters, actor);
    const rows = await this.repository.getAppointmentsTrend(scopedFilters);

    return rows.map((row) => ({
      period: row.period,
      totalAppointments: Number(row.totalAppointments || 0),
      scheduledAppointments: Number(row.scheduledAppointments || 0),
      confirmedAppointments: Number(row.confirmedAppointments || 0),
      completedAppointments: Number(row.completedAppointments || 0),
      cancelledAppointments: Number(row.cancelledAppointments || 0),
      noShowAppointments: Number(row.noShowAppointments || 0),
      theoreticalRevenue: Number(row.theoreticalRevenue || 0)
    }));
  }

  async getBySpecialty(filters, actor) {
    const scopedFilters = await this.normalizeFilters(filters, actor);
    const rows = await this.repository.getBySpecialty(scopedFilters);

    return rows.map((row) => ({
      specialty: {
        id: Number(row.specialtyId),
        name: row.specialtyName
      },
      totalAppointments: Number(row.totalAppointments || 0),
      completedAppointments: Number(row.completedAppointments || 0),
      theoreticalRevenue: Number(row.theoreticalRevenue || 0)
    }));
  }

  async getUpcoming(filters, actor) {
    const scopedFilters = await this.normalizeFilters(filters, actor);
    const rows = await this.repository.getUpcoming(scopedFilters);

    return rows.map((row) => ({
      id: Number(row.id),
      patientId: Number(row.patientId),
      doctorId: Number(row.doctorId),
      medicalServiceId: Number(row.medicalServiceId),
      scheduledAt: row.scheduledAt,
      endAt: row.endAt,
      durationMinutesSnapshot: Number(row.durationMinutesSnapshot),
      priceSnapshot: Number(row.priceSnapshot),
      status: row.status,
      operationalNotes: row.operationalNotes,
      patient: {
        firstName: row.patientFirstName,
        lastName: row.patientLastName
      },
      doctor: {
        firstName: row.doctorFirstName,
        lastName: row.doctorLastName
      },
      medicalService: {
        name: row.medicalServiceName
      },
      specialty: {
        name: row.specialtyName
      }
    }));
  }

  async normalizeFilters(filters, actor) {
    const role = actor.role;

    if (![USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST, USER_ROLES.DOCTOR].includes(role)) {
      throw new ForbiddenError('Ruolo non autorizzato');
    }

    const normalized = {
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
      groupBy: filters.groupBy === 'month' ? 'month' : 'day',
      limit: filters.limit ? Number(filters.limit) : 10,
      now: getClinicNow().dateTime
    };

    if (normalized.dateFrom && normalized.dateTo && normalized.dateFrom > normalized.dateTo) {
      throw new BadRequestError('dateFrom deve essere minore o uguale a dateTo');
    }

    if (normalized.limit < 1 || normalized.limit > 100) {
      throw new BadRequestError('limit deve essere compreso tra 1 e 100');
    }

    if (role === USER_ROLES.DOCTOR) {
      const ownDoctorId = await this.resolveDoctorScope(actor);

      if (filters.doctorId && Number(filters.doctorId) !== ownDoctorId) {
        throw new ForbiddenError('Filtro doctorId non consentito');
      }

      normalized.doctorId = ownDoctorId;
      return normalized;
    }

    normalized.doctorId = filters.doctorId ? Number(filters.doctorId) : undefined;

    return normalized;
  }

  async resolveDoctorScope(actor) {
    const doctor = await this.doctors.findByUserId(Number(actor.sub));

    if (!doctor) {
      throw new ForbiddenError('Profilo medico non associato');
    }

    return doctor.id;
  }

  getTimezone() {
    return getClinicTimezone();
  }
}

export const dashboardService = new DashboardService();
