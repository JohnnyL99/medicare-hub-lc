'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('patients', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      birth_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(30),
        allowNull: false
      },
      fiscal_code: {
        type: Sequelize.STRING(32),
        allowNull: true,
        unique: true
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

    await queryInterface.addIndex('patients', ['email'], {
      name: 'patients_email_idx'
    });
    await queryInterface.addIndex('patients', ['phone'], {
      name: 'patients_phone_idx'
    });
    await queryInterface.addIndex('patients', ['is_active'], {
      name: 'patients_is_active_idx'
    });
    await queryInterface.addIndex('patients', ['last_name', 'first_name', 'birth_date'], {
      name: 'patients_identity_lookup_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('patients');
  }
};
