"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("cards", "workspace_id", {
      type: Sequelize.INTEGER,
      references: {
        model: {
          tableName: "workspaces",
        },
        key: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("cards", "workspace_id");
  },
};
