import { DataTypes, Model } from 'sequelize';
import { APPOINTMENT_STATUSES } from '../utils/constants.js';

export class Appointment extends Model {
  static initModel(sequelize) {
    Appointment.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        patientId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          field: 'patient_id'
        },
        doctorId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          field: 'doctor_id'
        },
        medicalServiceId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          field: 'medical_service_id'
        },
        scheduledAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'scheduled_at'
        },
        endAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'end_at'
        },
        durationMinutesSnapshot: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'duration_minutes_snapshot'
        },
        priceSnapshot: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          field: 'price_snapshot'
        },
        status: {
          type: DataTypes.ENUM(...Object.values(APPOINTMENT_STATUSES)),
          allowNull: false,
          defaultValue: APPOINTMENT_STATUSES.SCHEDULED
        },
        operationalNotes: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'operational_notes'
        },
        createdBy: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          field: 'created_by'
        }
      },
      {
        sequelize,
        modelName: 'Appointment',
        tableName: 'appointments',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        validate: {
          endAfterStart() {
            if (this.endAt <= this.scheduledAt) {
              throw new Error('end_at must be greater than scheduled_at');
            }
          }
        }
      }
    );

    return Appointment;
  }

  static associate(models) {
    Appointment.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient'
    });

    Appointment.belongsTo(models.Doctor, {
      foreignKey: 'doctorId',
      as: 'doctor'
    });

    Appointment.belongsTo(models.MedicalService, {
      foreignKey: 'medicalServiceId',
      as: 'medicalService'
    });

    Appointment.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  }
}
