'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('availabilities', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      doctor_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      weekday: {
        type: Sequelize.TINYINT.UNSIGNED,
        allowNull: false
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    await queryInterface.addIndex('availabilities', ['doctor_id'], {
      name: 'availabilities_doctor_id_idx'
    });
    await queryInterface.addIndex('availabilities', ['is_active'], {
      name: 'availabilities_is_active_idx'
    });
    await queryInterface.addIndex(
      'availabilities',
      ['doctor_id', 'weekday', 'start_time', 'end_time'],
      {
        name: 'availabilities_doctor_weekday_slot_unique_idx',
        unique: true
      }
    );
    await queryInterface.addIndex('availabilities', ['doctor_id', 'weekday'], {
      name: 'availabilities_doctor_weekday_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('availabilities');
  }
};
