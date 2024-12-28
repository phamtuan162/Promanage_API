"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Board extends Model {
    static associate(models) {
      Board.belongsTo(models.Workspace, {
        foreignKey: "workspace_id",
        as: "workspaces",
      });
      Board.hasMany(models.Column, {
        foreignKey: "board_id",
        as: "columns",
      });
      Board.hasMany(models.Activity, {
        foreignKey: "board_id",
        as: "activities",
      });
    }
  }
  Board.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      workspace_id: DataTypes.INTEGER,
      title: DataTypes.STRING,
      desc: DataTypes.STRING,
      type: DataTypes.STRING,
      background: DataTypes.STRING,
      status: DataTypes.STRING,
      columnOrderIds: DataTypes.ARRAY(DataTypes.INTEGER),
    },
    {
      sequelize,
      modelName: "Board",
      tableName: "boards",
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true, //Kích hoạt xóa mềm
      deletedAt: "deleted_at",
    }
  );
  return Board;
};
