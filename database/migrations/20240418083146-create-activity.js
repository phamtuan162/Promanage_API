"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("activities", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      action: {
        type: Sequelize.STRING,
      },
      desc: { type: Sequelize.STRING },
      title: { type: Sequelize.STRING },
      card_id: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: "cards",
          },
          key: "id",
        },
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
      column_id: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: "columns",
          },
          key: "id",
        },
      },
      workspace_id: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: "workspaces",
          },
          key: "id",
        },
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: "users",
          },
          key: "id",
        },
      },
      userName: { type: Sequelize.STRING },
      userAvatar: { type: Sequelize.STRING },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("activities");
  },
};
