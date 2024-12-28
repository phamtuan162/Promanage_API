"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Work extends Model {
    static associate(models) {
      Work.belongsTo(models.Card, {
        foreignKey: "card_id",
        as: "card",
      });
      Work.hasMany(models.Mission, {
        foreignKey: "work_id",
        as: "missions",
      });
    }
  }
  Work.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: DataTypes.STRING,
      card_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Work",
      tableName: "works",
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return Work;
};
