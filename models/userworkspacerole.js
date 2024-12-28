"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class UserWorkspaceRole extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {}
  }
  UserWorkspaceRole.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: DataTypes.INTEGER,
      role_id: DataTypes.INTEGER,
      workspace_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "UserWorkspaceRole",
      tableName: "users_workspaces_roles",
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true, //Kích hoạt xóa mềm
      deletedAt: "deleted_at",
    }
  );
  return UserWorkspaceRole;
};
