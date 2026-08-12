import { DataTypes, Model } from 'sequelize';
import { USER_ROLES } from '../utils/constants.js';

export class User extends Model {
  static initModel(sequelize) {
    User.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        firstName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'first_name'
        },
        lastName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'last_name'
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true
          }
        },
        passwordHash: {
          type: DataTypes.STRING(255),
          allowNull: false,
          field: 'password_hash'
        },
        role: {
          type: DataTypes.ENUM(...Object.values(USER_ROLES)),
          allowNull: false
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'is_active'
        }
      },
      {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    );

    return User;
  }

  static associate(models) {
    User.hasOne(models.Doctor, {
      foreignKey: 'userId',
      as: 'doctorProfile'
    });

    User.hasMany(models.Appointment, {
      foreignKey: 'createdBy',
      as: 'createdAppointments'
    });
  }
}
