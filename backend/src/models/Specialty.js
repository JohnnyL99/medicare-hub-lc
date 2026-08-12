import { DataTypes, Model } from 'sequelize';

export class Specialty extends Model {
  static initModel(sequelize) {
    Specialty.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        name: {
          type: DataTypes.STRING(120),
          allowNull: false,
          unique: true
        },
        description: {
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
        modelName: 'Specialty',
        tableName: 'specialties',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    );

    return Specialty;
  }

  static associate(models) {
    Specialty.hasMany(models.Doctor, {
      foreignKey: 'specialtyId',
      as: 'doctors'
    });

    Specialty.hasMany(models.MedicalService, {
      foreignKey: 'specialtyId',
      as: 'medicalServices'
    });
  }
}
