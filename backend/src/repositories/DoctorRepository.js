import { Op } from 'sequelize';
import { models } from '../config/database.js';

export class DoctorRepository {
  constructor(doctorModel = models.Doctor) {
    this.doctorModel = doctorModel;
  }

  async findByUserId(userId) {
    return this.doctorModel.findOne({
      where: {
        userId
      }
    });
  }

  async findPaginated({ page, pageSize, name, specialtyId, isActive, orderBy, sortOrder }) {
    const where = {};
    const userWhere = {};

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (specialtyId) {
      where.specialtyId = specialtyId;
    }

    if (name) {
      userWhere[Op.or] = [
        {
          firstName: {
            [Op.like]: `%${name}%`
          }
        },
        {
          lastName: {
            [Op.like]: `%${name}%`
          }
        },
        {
          email: {
            [Op.like]: `%${name}%`
          }
        }
      ];
    }

    return this.doctorModel.findAndCountAll({
      where,
      include: [
        {
          model: models.User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'isActive'],
          ...(name ? { where: userWhere, required: true } : {})
        },
        {
          model: models.Specialty,
          as: 'primarySpecialty',
          attributes: ['id', 'name', 'isActive']
        },
        {
          model: models.MedicalService,
          as: 'medicalServices',
          attributes: ['id', 'specialtyId', 'name', 'durationMinutes', 'currentPrice', 'isActive'],
          through: {
            attributes: []
          }
        }
      ],
      distinct: true,
      order:
        orderBy === 'lastName'
          ? [[{ model: models.User, as: 'user' }, 'lastName', sortOrder]]
          : [[orderBy, sortOrder]],
      limit: pageSize,
      offset: (page - 1) * pageSize
    });
  }

  async findById(id, transaction) {
    return this.doctorModel.findByPk(id, {
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
        },
        {
          model: models.MedicalService,
          as: 'medicalServices',
          attributes: ['id', 'specialtyId', 'name', 'durationMinutes', 'currentPrice', 'isActive'],
          through: {
            attributes: []
          }
        }
      ],
      transaction
    });
  }

  async findByLicenseNumber(licenseNumber, excludedId, transaction) {
    const where = {
      licenseNumber
    };

    if (excludedId) {
      where.id = {
        [Op.ne]: excludedId
      };
    }

    return this.doctorModel.findOne({
      where,
      transaction
    });
  }

  async create(payload, transaction) {
    return this.doctorModel.create(payload, { transaction });
  }

  async update(entity, payload, transaction) {
    return entity.update(payload, { transaction });
  }
}

export const doctorRepository = new DoctorRepository();
