import { DataTypes, Model } from 'sequelize';

export class Doctor extends Model {
  static initModel(sequelize) {
    Doctor.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        userId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          unique: true,
          field: 'user_id'
        },
        specialtyId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          field: 'specialty_id'
        },
        licenseNumber: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
          field: 'license_number'
        },
        biography: {
          type: DataTypes.TEXT,
          allowNull: true
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
        modelName: 'Doctor',
        tableName: 'doctors',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    );

    return Doctor;
  }

  static associate(models) {
    Doctor.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    Doctor.belongsTo(models.Specialty, {
      foreignKey: 'specialtyId',
      as: 'primarySpecialty'
    });

    Doctor.belongsToMany(models.MedicalService, {
      through: models.DoctorService,
      foreignKey: 'doctorId',
      otherKey: 'medicalServiceId',
      as: 'medicalServices'
    });

    Doctor.hasMany(models.Availability, {
      foreignKey: 'doctorId',
      as: 'availabilities'
    });

    Doctor.hasMany(models.Appointment, {
      foreignKey: 'doctorId',
      as: 'appointments'
    });
  }
}
