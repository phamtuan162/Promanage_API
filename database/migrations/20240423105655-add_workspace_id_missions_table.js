"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("missions", "workspace_id", {
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
    await queryInterface.removeColumn("missions", "workspace_id");
  },
};
