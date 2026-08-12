'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('medical_services', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      specialty_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'specialties',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      duration_minutes: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      current_price: {
        type: Sequelize.DECIMAL(10, 2),
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

    await queryInterface.addIndex('medical_services', ['specialty_id'], {
      name: 'medical_services_specialty_id_idx'
    });
    await queryInterface.addIndex('medical_services', ['is_active'], {
      name: 'medical_services_is_active_idx'
    });
    await queryInterface.addIndex('medical_services', ['specialty_id', 'name'], {
      name: 'medical_services_specialty_name_unique_idx',
      unique: true
    });
    await queryInterface.addIndex('medical_services', ['name'], {
      name: 'medical_services_name_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('medical_services');
  }
};
