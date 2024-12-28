"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Workspace extends Model {
    static associate(models) {
      Workspace.hasMany(models.Board, {
        foreignKey: "workspace_id",
        as: "boards",
      });
      Workspace.belongsToMany(models.User, {
        foreignKey: "workspace_id",
        through: {
          model: models.UserWorkspaceRole, // Bảng trung gian
          paranoid: true, // Chỉ lấy các bản ghi chưa bị xóa mềm
        },
        as: "users",
      });
      Workspace.hasMany(models.Activity, {
        foreignKey: "workspace_id",
        as: "activities",
      });
      Workspace.hasMany(models.Mission, {
        foreignKey: "workspace_id",
        as: "missions",
      });
      Workspace.hasMany(models.Card, {
        foreignKey: "workspace_id",
        as: "cards",
      });
    }
  }
  Workspace.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      total_user: DataTypes.INTEGER,
      name: DataTypes.STRING,
      desc: DataTypes.STRING,
      isActive: DataTypes.BOOLEAN,
      color: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Workspace",
      tableName: "workspaces",
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true, //Kích hoạt xóa mềm
      deletedAt: "deleted_at",
    }
  );
  return Workspace;
};
