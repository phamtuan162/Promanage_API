"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Card extends Model {
    static associate(models) {
      Card.belongsTo(models.Column, {
        foreignKey: "column_id",
        as: "column",
      });
      Card.belongsToMany(models.User, {
        foreignKey: "card_id",
        through: {
          model: models.UserCard, // Bảng trung gian
          paranoid: true, // Chỉ lấy các bản ghi chưa bị xóa mềm
        },
        as: "users",
      });
      Card.hasMany(models.Work, {
        foreignKey: "card_id",
        as: "works",
      });
      Card.hasMany(models.Activity, {
        foreignKey: "card_id",
        as: "activities",
      });
      Card.hasMany(models.Attachment, {
        foreignKey: "card_id",
        as: "attachments",
      });
      Card.hasMany(models.Comment, {
        foreignKey: "card_id",
        as: "comments",
      });
      Card.belongsTo(models.Workspace, {
        foreignKey: "workspace_id",
        as: "workspace",
      });
    }
  }
  Card.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      workspace_id: DataTypes.INTEGER,
      column_id: DataTypes.INTEGER,
      title: DataTypes.STRING,
      desc: DataTypes.STRING,
      background: DataTypes.STRING,
      dueDate: DataTypes.DATE,
      startDateTime: DataTypes.DATE,
      endDateTime: DataTypes.DATE,
      status: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Card",
      tableName: "cards",
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true, //Kích hoạt xóa mềm
      deletedAt: "deleted_at",
    }
  );
  return Card;
};
