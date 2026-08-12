import { Op } from 'sequelize';
import { models } from '../config/database.js';

export class AvailabilityRepository {
  constructor(availabilityModel = models.Availability) {
    this.availabilityModel = availabilityModel;
  }

  async findByDoctorId(doctorId, transaction) {
    return this.availabilityModel.findAll({
      where: {
        doctorId
      },
      order: [
        ['weekday', 'ASC'],
        ['startTime', 'ASC']
      ],
      transaction
    });
  }

  async findActiveByDoctorAndWeekday(doctorId, weekday, transaction) {
    return this.availabilityModel.findAll({
      where: {
        doctorId,
        weekday,
        isActive: true
      },
      order: [['startTime', 'ASC']],
      transaction
    });
  }

  async findById(id, transaction) {
    return this.availabilityModel.findByPk(id, { transaction });
  }

  async findOverlapping({ doctorId, weekday, startTime, endTime, excludedId }, transaction) {
    const where = {
      doctorId,
      weekday,
      isActive: true,
      startTime: {
        [Op.lt]: endTime
      },
      endTime: {
        [Op.gt]: startTime
      }
    };

    if (excludedId) {
      where.id = {
        [Op.ne]: excludedId
      };
    }

    return this.availabilityModel.findOne({
      where,
      transaction
    });
  }

  async create(payload, transaction) {
    return this.availabilityModel.create(payload, { transaction });
  }

  async update(entity, payload, transaction) {
    return entity.update(payload, { transaction });
  }

  async destroy(entity, transaction) {
    return entity.destroy({ transaction });
  }
}

export const availabilityRepository = new AvailabilityRepository();
