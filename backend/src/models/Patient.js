import { DataTypes, Model } from 'sequelize';

export class Patient extends Model {
  static initModel(sequelize) {
    Patient.init(
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
        birthDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          field: 'birth_date'
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: true,
          validate: {
            isEmail: true
          }
        },
        phone: {
          type: DataTypes.STRING(30),
          allowNull: false
        },
        fiscalCode: {
          type: DataTypes.STRING(32),
          allowNull: true,
          unique: true,
          field: 'fiscal_code'
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
        modelName: 'Patient',
        tableName: 'patients',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    );

    return Patient;
  }

  static associate(models) {
    Patient.hasMany(models.Appointment, {
      foreignKey: 'patientId',
      as: 'appointments'
    });
  }
}
