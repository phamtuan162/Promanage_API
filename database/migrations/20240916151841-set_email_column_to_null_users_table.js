"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.changeColumn("users", "email", {
        type: Sequelize.STRING,
        allowNull: true, // Cho phép giá trị NULL
      });
    } catch (error) {
      console.error("Error in migration up:", error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.changeColumn("users", "email", {
        type: Sequelize.STRING,
        allowNull: false, // Quay lại trạng thái không cho phép giá trị NULL
      });
    } catch (error) {
      console.error("Error in migration down:", error.message);
    }
  },
};
