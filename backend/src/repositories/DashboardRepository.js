import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export class DashboardRepository {
  constructor(db = sequelize) {
    this.db = db;
  }

  async getSummary(filters) {
    const { whereClause, replacements } = this.buildAppointmentWhere(filters, 'a');

    const [row] = await this.db.query(
      `
        SELECT
          COUNT(*) AS totalAppointments,
          SUM(CASE WHEN a.status = 'SCHEDULED' THEN 1 ELSE 0 END) AS scheduledAppointments,
          SUM(CASE WHEN a.status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmedAppointments,
          SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completedAppointments,
          SUM(CASE WHEN a.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelledAppointments,
          SUM(CASE WHEN a.status = 'NO_SHOW' THEN 1 ELSE 0 END) AS noShowAppointments,
          COUNT(DISTINCT CASE WHEN p.is_active = true THEN p.id END) AS activePatients,
          COALESCE(SUM(CASE WHEN a.status = 'COMPLETED' THEN a.price_snapshot ELSE 0 END), 0) AS theoreticalRevenue
        FROM appointments a
        INNER JOIN patients p ON p.id = a.patient_id
        ${whereClause}
      `,
      {
        replacements,
        type: QueryTypes.SELECT
      }
    );

    return row;
  }

  async getAppointmentsTrend(filters) {
    const { whereClause, replacements } = this.buildAppointmentWhere(filters, 'a');
    const periodExpression =
      filters.groupBy === 'month'
        ? "DATE_FORMAT(a.scheduled_at, '%Y-%m-01')"
        : 'DATE(a.scheduled_at)';

    return this.db.query(
      `
        SELECT
          ${periodExpression} AS period,
          COUNT(*) AS totalAppointments,
          SUM(CASE WHEN a.status = 'SCHEDULED' THEN 1 ELSE 0 END) AS scheduledAppointments,
          SUM(CASE WHEN a.status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmedAppointments,
          SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completedAppointments,
          SUM(CASE WHEN a.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelledAppointments,
          SUM(CASE WHEN a.status = 'NO_SHOW' THEN 1 ELSE 0 END) AS noShowAppointments,
          COALESCE(SUM(CASE WHEN a.status = 'COMPLETED' THEN a.price_snapshot ELSE 0 END), 0) AS theoreticalRevenue
        FROM appointments a
        ${whereClause}
        GROUP BY period
        ORDER BY period ASC
      `,
      {
        replacements,
        type: QueryTypes.SELECT
      }
    );
  }

  async getBySpecialty(filters) {
    const { whereClause, replacements } = this.buildAppointmentWhere(filters, 'a');

    return this.db.query(
      `
        SELECT
          s.id AS specialtyId,
          s.name AS specialtyName,
          COUNT(*) AS totalAppointments,
          SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completedAppointments,
          COALESCE(SUM(CASE WHEN a.status = 'COMPLETED' THEN a.price_snapshot ELSE 0 END), 0) AS theoreticalRevenue
        FROM appointments a
        INNER JOIN medical_services ms ON ms.id = a.medical_service_id
        INNER JOIN specialties s ON s.id = ms.specialty_id
        ${whereClause}
        GROUP BY s.id, s.name
        ORDER BY s.name ASC
      `,
      {
        replacements,
        type: QueryTypes.SELECT
      }
    );
  }

  async getUpcoming(filters) {
    const { whereClause, replacements } = this.buildAppointmentWhere(filters, 'a', {
      forceFutureOnly: true
    });

    return this.db.query(
      `
        SELECT
          a.id,
          a.patient_id AS patientId,
          a.doctor_id AS doctorId,
          a.medical_service_id AS medicalServiceId,
          a.scheduled_at AS scheduledAt,
          a.end_at AS endAt,
          a.duration_minutes_snapshot AS durationMinutesSnapshot,
          a.price_snapshot AS priceSnapshot,
          a.status,
          a.operational_notes AS operationalNotes,
          p.first_name AS patientFirstName,
          p.last_name AS patientLastName,
          du.first_name AS doctorFirstName,
          du.last_name AS doctorLastName,
          ms.name AS medicalServiceName,
          s.name AS specialtyName
        FROM appointments a
        INNER JOIN patients p ON p.id = a.patient_id
        INNER JOIN doctors d ON d.id = a.doctor_id
        INNER JOIN users du ON du.id = d.user_id
        INNER JOIN medical_services ms ON ms.id = a.medical_service_id
        INNER JOIN specialties s ON s.id = ms.specialty_id
        ${whereClause}
        ORDER BY a.scheduled_at ASC
        LIMIT :limit
      `,
      {
        replacements: {
          ...replacements,
          limit: filters.limit
        },
        type: QueryTypes.SELECT
      }
    );
  }

  buildAppointmentWhere(filters, alias, options = {}) {
    const conditions = [];
    const replacements = {};

    if (filters.dateFrom) {
      conditions.push(`${alias}.scheduled_at >= :dateFrom`);
      replacements.dateFrom = filters.dateFrom;
    }

    if (filters.dateTo) {
      conditions.push(`${alias}.scheduled_at <= :dateTo`);
      replacements.dateTo = filters.dateTo;
    }

    if (filters.doctorId) {
      conditions.push(`${alias}.doctor_id = :doctorId`);
      replacements.doctorId = filters.doctorId;
    }

    if (options.forceFutureOnly) {
      conditions.push(`${alias}.scheduled_at >= :now`);
      replacements.now = filters.now;
      conditions.push(`${alias}.status IN ('SCHEDULED', 'CONFIRMED')`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    return {
      whereClause,
      replacements
    };
  }
}

export const dashboardRepository = new DashboardRepository();
