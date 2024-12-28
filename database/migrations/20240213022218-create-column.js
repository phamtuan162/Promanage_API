"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("columns", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      title: {
        type: Sequelize.STRING,
      },
      board_id: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: "boards",
          },
          key: "id",
        },
      },
      cardOrderIds: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("columns");
  },
};
