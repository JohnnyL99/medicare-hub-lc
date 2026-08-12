import { DataTypes, Model } from 'sequelize';

export class Availability extends Model {
  static initModel(sequelize) {
    Availability.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        doctorId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          field: 'doctor_id'
        },
        weekday: {
          type: DataTypes.TINYINT.UNSIGNED,
          allowNull: false,
          validate: {
            min: 1,
            max: 7
          }
        },
        startTime: {
          type: DataTypes.TIME,
          allowNull: false,
          field: 'start_time'
        },
        endTime: {
          type: DataTypes.TIME,
          allowNull: false,
          field: 'end_time'
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
        modelName: 'Availability',
        tableName: 'availabilities',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        validate: {
          endAfterStart() {
            if (this.endTime <= this.startTime) {
              throw new Error('end_time must be greater than start_time');
            }
          }
        }
      }
    );

    return Availability;
  }

  static associate(models) {
    Availability.belongsTo(models.Doctor, {
      foreignKey: 'doctorId',
      as: 'doctor'
    });
  }
}
