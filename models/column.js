"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Column extends Model {
    static associate(models) {
      Column.belongsTo(models.Board, {
        foreignKey: "board_id",
        as: "boards",
      });
      Column.hasMany(models.Card, {
        foreignKey: "column_id",
        as: "cards",
      });
      Column.hasMany(models.Activity, {
        foreignKey: "column_id",
        as: "activities",
      });
    }
  }
  Column.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      board_id: DataTypes.INTEGER,
      cardOrderIds: DataTypes.ARRAY(DataTypes.INTEGER),
      title: DataTypes.STRING,
      order: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Column",
      tableName: "columns",
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true, //Kích hoạt xóa mềm
      deletedAt: "deleted_at",
    }
  );
  return Column;
};
