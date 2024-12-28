"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Activity extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Activity.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
      Activity.belongsTo(models.Column, {
        foreignKey: "column_id",
        as: "column",
      });
      Activity.belongsTo(models.Card, {
        foreignKey: "card_id",
        as: "card",
      });
      Activity.belongsTo(models.Board, {
        foreignKey: "board_id",
        as: "board",
      });
      Activity.belongsTo(models.Workspace, {
        foreignKey: "workspace_id",
        as: "workspace",
      });
    }
  }
  Activity.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      desc: DataTypes.STRING,
      title: DataTypes.STRING,
      user_id: DataTypes.INTEGER,
      card_id: DataTypes.INTEGER,
      board_id: DataTypes.INTEGER,
      column_id: DataTypes.INTEGER,
      workspace_id: DataTypes.INTEGER,
      action: DataTypes.STRING,
      userName: DataTypes.STRING,
      userAvatar: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Activity",
      tableName: "activities",
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return Activity;
};
