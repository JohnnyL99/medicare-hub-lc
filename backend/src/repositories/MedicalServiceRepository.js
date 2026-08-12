import { Op } from 'sequelize';
import { models } from '../config/database.js';

export class MedicalServiceRepository {
  constructor(medicalServiceModel = models.MedicalService) {
    this.medicalServiceModel = medicalServiceModel;
  }

  async findPaginated({
    page,
    pageSize,
    name,
    isActive,
    orderBy,
    sortOrder,
    doctorId
  }) {
    const where = {};

    if (name) {
      where.name = {
        [Op.like]: `%${name}%`
      };
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    const include = [
      {
        model: models.Specialty,
        as: 'specialty'
      }
    ];

    if (doctorId) {
      include.push({
        model: models.Doctor,
        as: 'doctors',
        attributes: [],
        through: {
          attributes: []
        },
        where: {
          id: doctorId
        },
        required: true
      });
    }

    return this.medicalServiceModel.findAndCountAll({
      where,
      include,
      distinct: true,
      order: [[orderBy, sortOrder]],
      limit: pageSize,
      offset: (page - 1) * pageSize
    });
  }

  async findById(id, doctorId) {
    const include = [
      {
        model: models.Specialty,
        as: 'specialty'
      }
    ];

    if (doctorId) {
      include.push({
        model: models.Doctor,
        as: 'doctors',
        attributes: [],
        through: {
          attributes: []
        },
        where: {
          id: doctorId
        },
        required: true
      });
    }

    return this.medicalServiceModel.findOne({
      where: {
        id
      },
      include
    });
  }

  async findByNameInSpecialty(name, specialtyId, excludedId) {
    const where = {
      name,
      specialtyId
    };

    if (excludedId) {
      where.id = {
        [Op.ne]: excludedId
      };
    }

    return this.medicalServiceModel.findOne({ where });
  }

  async create(payload) {
    return this.medicalServiceModel.create(payload);
  }

  async update(entity, payload) {
    return entity.update(payload);
  }

  async findActiveByIds(ids, specialtyId, transaction) {
    const where = {
      id: {
        [Op.in]: ids
      },
      isActive: true
    };

    if (specialtyId) {
      where.specialtyId = specialtyId;
    }

    return this.medicalServiceModel.findAll({
      where,
      transaction
    });
  }

  async findAllActive() {
    return this.medicalServiceModel.findAll({
      where: {
        isActive: true
      },
      include: [
        {
          model: models.Specialty,
          as: 'specialty'
        }
      ],
      order: [['name', 'ASC']]
    });
  }
}

export const medicalServiceRepository = new MedicalServiceRepository();
