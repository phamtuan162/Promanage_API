"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Provider, {
        foreignKey: "provider_id",
        as: "providers",
      });

      User.hasMany(models.Device, {
        foreignKey: "user_id",
        as: "devices",
      });

      User.belongsToMany(models.Workspace, {
        foreignKey: "user_id",
        through: {
          model: models.UserWorkspaceRole, // Bảng trung gian
          paranoid: true, // Chỉ lấy các bản ghi chưa bị xóa mềm
        },
        as: "workspaces",
      });

      User.belongsToMany(models.Card, {
        foreignKey: "user_id",
        through: {
          model: models.UserCard, // Bảng trung gian
          paranoid: true, // Chỉ lấy các bản ghi chưa bị xóa mềm
        },
        as: "cards",
      });

      User.hasMany(models.Mission, {
        foreignKey: "user_id",
        as: "missions",
      });

      User.hasMany(models.Activity, {
        foreignKey: "user_id",
        as: "activities",
      });

      User.hasMany(models.Attachment, {
        foreignKey: "user_id",
        as: "attachments",
      });

      User.hasMany(models.Comment, {
        foreignKey: "user_id",
        as: "comments",
      });

      User.hasMany(models.Notification, {
        foreignKey: "user_id",
        as: "notifications",
      });
    }
  }
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      provider_id: DataTypes.INTEGER,
      workspace_id_active: DataTypes.INTEGER,
      name: DataTypes.STRING,
      phone: DataTypes.STRING,
      background: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      isOnline: DataTypes.BOOLEAN,
      status: DataTypes.BOOLEAN,
      avatar: DataTypes.STRING,
      refresh_token: DataTypes.STRING,
      github_id: DataTypes.BIGINT,
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true, //Kích hoạt xóa mềm
      deletedAt: "deleted_at",
    }
  );
  return User;
};
