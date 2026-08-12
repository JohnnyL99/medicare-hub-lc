import { DataTypes, Model } from 'sequelize';

export class DoctorService extends Model {
  static initModel(sequelize) {
    DoctorService.init(
      {
        doctorId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          primaryKey: true,
          field: 'doctor_id'
        },
        medicalServiceId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          primaryKey: true,
          field: 'medical_service_id'
        }
      },
      {
        sequelize,
        modelName: 'DoctorService',
        tableName: 'doctor_services',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    );

    return DoctorService;
  }

  static associate(models) {
    DoctorService.belongsTo(models.Doctor, {
      foreignKey: 'doctorId',
      as: 'doctor'
    });

    DoctorService.belongsTo(models.MedicalService, {
      foreignKey: 'medicalServiceId',
      as: 'medicalService'
    });
  }
}
