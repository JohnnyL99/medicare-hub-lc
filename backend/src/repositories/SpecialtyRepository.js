import { Op } from 'sequelize';
import { models } from '../config/database.js';

export class SpecialtyRepository {
  constructor(specialtyModel = models.Specialty) {
    this.specialtyModel = specialtyModel;
  }

  async findPaginated({ page, pageSize, name, isActive, orderBy, sortOrder }) {
    const where = {};

    if (name) {
      where.name = {
        [Op.like]: `%${name}%`
      };
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    return this.specialtyModel.findAndCountAll({
      where,
      order: [[orderBy, sortOrder]],
      limit: pageSize,
      offset: (page - 1) * pageSize
    });
  }

  async findById(id) {
    return this.specialtyModel.findByPk(id);
  }

  async findByName(name) {
    return this.specialtyModel.findOne({
      where: {
        name
      }
    });
  }

  async create(payload) {
    return this.specialtyModel.create(payload);
  }

  async update(entity, payload) {
    return entity.update(payload);
  }
}

export const specialtyRepository = new SpecialtyRepository();
