'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('appointments', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      patient_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      doctor_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      medical_service_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'medical_services',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      scheduled_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      duration_minutes_snapshot: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      price_snapshot: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM(
          'SCHEDULED',
          'CONFIRMED',
          'COMPLETED',
          'CANCELLED',
          'NO_SHOW'
        ),
        allowNull: false,
        defaultValue: 'SCHEDULED'
      },
      operational_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('appointments', ['patient_id'], {
      name: 'appointments_patient_id_idx'
    });
    await queryInterface.addIndex('appointments', ['doctor_id'], {
      name: 'appointments_doctor_id_idx'
    });
    await queryInterface.addIndex('appointments', ['medical_service_id'], {
      name: 'appointments_medical_service_id_idx'
    });
    await queryInterface.addIndex('appointments', ['created_by'], {
      name: 'appointments_created_by_idx'
    });
    await queryInterface.addIndex('appointments', ['status'], {
      name: 'appointments_status_idx'
    });
    await queryInterface.addIndex('appointments', ['scheduled_at'], {
      name: 'appointments_scheduled_at_idx'
    });
    await queryInterface.addIndex('appointments', ['doctor_id', 'scheduled_at'], {
      name: 'appointments_doctor_scheduled_at_idx'
    });
    await queryInterface.addIndex('appointments', ['doctor_id', 'end_at'], {
      name: 'appointments_doctor_end_at_idx'
    });
    await queryInterface.addIndex('appointments', ['patient_id', 'scheduled_at'], {
      name: 'appointments_patient_scheduled_at_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('appointments');
  }
};
