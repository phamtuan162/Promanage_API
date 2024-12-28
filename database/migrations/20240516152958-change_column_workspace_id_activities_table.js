"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Xóa ràng buộc khóa ngoại cũ
    await queryInterface.removeConstraint(
      "activities",
      "activities_workspace_id_fkey"
    );

    // Thêm ràng buộc khóa ngoại mới
    await queryInterface.addConstraint("activities", {
      fields: ["workspace_id"],
      type: "foreign key",
      name: "activities_workspace_id_fkey", // Tên ràng buộc cũ để giữ cho nhất quán
      references: {
        table: "workspaces",
        field: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // Xóa ràng buộc khóa ngoại mới
    await queryInterface.removeConstraint(
      "activities",
      "activities_workspace_id_fkey"
    );

    // Thêm lại ràng buộc khóa ngoại cũ
    await queryInterface.addConstraint("activities", {
      fields: ["workspace_id"],
      type: "foreign key",
      name: "activities_workspace_id_fkey", // Tên ràng buộc cũ để giữ cho nhất quán
      references: {
        table: "boards",
        field: "id",
      },
    });
  },
};
