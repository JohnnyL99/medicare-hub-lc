import { Op } from 'sequelize';
import { models } from '../config/database.js';

export class UserRepository {
  constructor(userModel = models.User) {
    this.userModel = userModel;
  }

  async findPaginated({ page, pageSize, name, isActive, role, orderBy, sortOrder }) {
    const where = {};

    if (name) {
      where[Op.or] = [
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

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (role) {
      where.role = role;
    }

    return this.userModel.findAndCountAll({
      where,
      include: [
        {
          model: models.Doctor,
          as: 'doctorProfile',
          attributes: ['id']
        }
      ],
      distinct: true,
      order: [[orderBy, sortOrder]],
      limit: pageSize,
      offset: (page - 1) * pageSize
    });
  }

  async findActiveByEmail(email) {
    return this.userModel.findOne({
      where: {
        email: {
          [Op.eq]: email
        },
        isActive: true
      }
    });
  }

  async findById(id) {
    return this.userModel.findByPk(id, {
      include: [
        {
          model: models.Doctor,
          as: 'doctorProfile',
          attributes: ['id']
        }
      ]
    });
  }

  async findByEmail(email, excludedId, transaction) {
    const where = {
      email
    };

    if (excludedId) {
      where.id = {
        [Op.ne]: excludedId
      };
    }

    return this.userModel.findOne({
      where,
      transaction
    });
  }

  async create(payload, transaction) {
    return this.userModel.create(payload, { transaction });
  }

  async update(entity, payload, transaction) {
    return entity.update(payload, { transaction });
  }
}

export const userRepository = new UserRepository();
