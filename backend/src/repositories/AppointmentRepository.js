import { Op, col, fn, where as sqlWhere } from 'sequelize';
import { models } from '../config/database.js';
import { APPOINTMENT_STATUSES } from '../utils/constants.js';

export class AppointmentRepository {
  constructor(appointmentModel = models.Appointment) {
    this.appointmentModel = appointmentModel;
  }

  buildIncludes(includeDoctorScope = false) {
    return [
      {
        model: models.Patient,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName', 'birthDate', 'email', 'phone', 'fiscalCode', 'isActive']
      },
      {
        model: models.Doctor,
        as: 'doctor',
        attributes: ['id', 'specialtyId', 'licenseNumber', 'isActive'],
        include: [
          {
            model: models.User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'isActive']
          },
          {
            model: models.Specialty,
            as: 'primarySpecialty',
            attributes: ['id', 'name', 'isActive']
          }
        ],
        ...(includeDoctorScope ? { required: true } : {})
      },
      {
        model: models.MedicalService,
        as: 'medicalService',
        attributes: ['id', 'specialtyId', 'name', 'durationMinutes', 'currentPrice', 'isActive'],
        include: [
          {
            model: models.Specialty,
            as: 'specialty',
            attributes: ['id', 'name', 'isActive']
          }
        ]
      },
      {
        model: models.User,
        as: 'creator',
        attributes: ['id', 'firstName', 'lastName', 'email', 'role']
      }
    ];
  }

  async findPaginated(filters) {
    const {
      page,
      pageSize,
      dateFrom,
      dateTo,
      doctorId,
      patientId,
      medicalServiceId,
      specialtyId,
      status,
      search,
      orderBy,
      sortOrder,
      scopedDoctorId
    } = filters;
    const where = {};
    const include = this.buildIncludes(Boolean(scopedDoctorId));

    if (dateFrom || dateTo) {
      where.scheduledAt = {};

      if (dateFrom) {
        where.scheduledAt[Op.gte] = dateFrom;
      }

      if (dateTo) {
        where.scheduledAt[Op.lte] = dateTo;
      }
    }

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (medicalServiceId) {
      where.medicalServiceId = medicalServiceId;
    }

    if (status) {
      where.status = status;
    }

    if (specialtyId) {
      include[1].where = {
        specialtyId
      };
      include[1].required = true;
    }

    if (scopedDoctorId) {
      include[1].where = {
        ...(include[1].where || {}),
        id: scopedDoctorId
      };
      include[1].required = true;
    }

    if (search) {
      const normalizedSearch = `%${search.toLowerCase()}%`;

      where[Op.or] = [
        sqlWhere(fn('LOWER', col('patient.first_name')), {
          [Op.like]: normalizedSearch
        }),
        sqlWhere(fn('LOWER', col('patient.last_name')), {
          [Op.like]: normalizedSearch
        }),
        sqlWhere(fn('LOWER', col('patient.email')), {
          [Op.like]: normalizedSearch
        }),
        sqlWhere(fn('LOWER', col('patient.fiscal_code')), {
          [Op.like]: normalizedSearch
        }),
        sqlWhere(fn('LOWER', col('doctor->user.first_name')), {
          [Op.like]: normalizedSearch
        }),
        sqlWhere(fn('LOWER', col('doctor->user.last_name')), {
          [Op.like]: normalizedSearch
        }),
        sqlWhere(fn('LOWER', col('doctor->user.email')), {
          [Op.like]: normalizedSearch
        }),
        sqlWhere(fn('LOWER', col('medicalService.name')), {
          [Op.like]: normalizedSearch
        })
      ];
    }

    return this.appointmentModel.findAndCountAll({
      where,
      include,
      distinct: true,
      order: this.buildOrder(orderBy, sortOrder),
      limit: pageSize,
      offset: (page - 1) * pageSize,
      subQuery: false
    });
  }

  async findById(id, transaction) {
    return this.appointmentModel.findByPk(id, {
      include: this.buildIncludes(),
      transaction
    });
  }

  async findOverlap({ doctorId, scheduledAt, endAt, excludedId, transaction }) {
    const where = {
      doctorId,
      status: {
        [Op.ne]: APPOINTMENT_STATUSES.CANCELLED
      },
      scheduledAt: {
        [Op.lt]: endAt
      },
      endAt: {
        [Op.gt]: scheduledAt
      }
    };

    if (excludedId) {
      where.id = {
        [Op.ne]: excludedId
      };
    }

    return this.appointmentModel.findOne({
      where,
      transaction
    });
  }

  async findNonCancelledByDoctorBetween(doctorId, startAt, endAt, transaction) {
    return this.appointmentModel.findAll({
      where: {
        doctorId,
        status: {
          [Op.ne]: APPOINTMENT_STATUSES.CANCELLED
        },
        scheduledAt: {
          [Op.lt]: endAt
        },
        endAt: {
          [Op.gt]: startAt
        }
      },
      order: [['scheduledAt', 'ASC']],
      transaction
    });
  }

  async create(payload, transaction) {
    return this.appointmentModel.create(payload, { transaction });
  }

  async update(entity, payload, transaction) {
    return entity.update(payload, { transaction });
  }

  buildOrder(orderBy, sortOrder) {
    if (orderBy === 'patientLastName') {
      return [[{ model: models.Patient, as: 'patient' }, 'lastName', sortOrder]];
    }

    if (orderBy === 'doctorLastName') {
      return [[{ model: models.Doctor, as: 'doctor' }, { model: models.User, as: 'user' }, 'lastName', sortOrder]];
    }

    if (orderBy === 'medicalServiceName') {
      return [[{ model: models.MedicalService, as: 'medicalService' }, 'name', sortOrder]];
    }

    return [[orderBy, sortOrder]];
  }
}

export const appointmentRepository = new AppointmentRepository();
