import { DataTypes, Model } from 'sequelize';

export class MedicalService extends Model {
  static initModel(sequelize) {
    MedicalService.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        specialtyId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          field: 'specialty_id'
        },
        name: {
          type: DataTypes.STRING(150),
          allowNull: false
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        durationMinutes: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'duration_minutes',
          validate: {
            min: 10
          }
        },
        currentPrice: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          field: 'current_price',
          validate: {
            min: 0
          }
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
        modelName: 'MedicalService',
        tableName: 'medical_services',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    );

    return MedicalService;
  }

  static associate(models) {
    MedicalService.belongsTo(models.Specialty, {
      foreignKey: 'specialtyId',
      as: 'specialty'
    });

    MedicalService.belongsToMany(models.Doctor, {
      through: models.DoctorService,
      foreignKey: 'medicalServiceId',
      otherKey: 'doctorId',
      as: 'doctors'
    });

    MedicalService.hasMany(models.Appointment, {
      foreignKey: 'medicalServiceId',
      as: 'appointments'
    });
  }
}
