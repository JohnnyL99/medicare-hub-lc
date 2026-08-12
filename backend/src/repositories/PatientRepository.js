import { Op } from 'sequelize';
import { models } from '../config/database.js';

export class PatientRepository {
  constructor(patientModel = models.Patient) {
    this.patientModel = patientModel;
  }

  async findPaginated({ page, pageSize, search, isActive, orderBy, sortOrder, doctorId }) {
    const where = {};

    if (search) {
      where[Op.or] = [
        {
          firstName: {
            [Op.like]: `%${search}%`
          }
        },
        {
          lastName: {
            [Op.like]: `%${search}%`
          }
        },
        {
          email: {
            [Op.like]: `%${search}%`
          }
        },
        {
          fiscalCode: {
            [Op.like]: `%${search}%`
          }
        }
      ];
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    const include = [];

    if (doctorId) {
      include.push({
        model: models.Appointment,
        as: 'appointments',
        attributes: [],
        where: {
          doctorId
        },
        required: true
      });
    }

    return this.patientModel.findAndCountAll({
      where,
      include,
      distinct: true,
      order: [[orderBy, sortOrder]],
      limit: pageSize,
      offset: (page - 1) * pageSize
    });
  }

  async findById(id) {
    return this.patientModel.findByPk(id);
  }

  async findByFiscalCode(fiscalCode, excludedId) {
    if (!fiscalCode) {
      return null;
    }

    const where = {
      fiscalCode
    };

    if (excludedId) {
      where.id = {
        [Op.ne]: excludedId
      };
    }

    return this.patientModel.findOne({ where });
  }

  async create(payload) {
    return this.patientModel.create(payload);
  }

  async update(entity, payload) {
    return entity.update(payload);
  }

  async isLinkedToDoctor(patientId, doctorId) {
    const appointment = await models.Appointment.findOne({
      where: {
        patientId,
        doctorId
      },
      attributes: ['id']
    });

    return Boolean(appointment);
  }
}

export const patientRepository = new PatientRepository();
