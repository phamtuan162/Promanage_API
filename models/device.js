"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Device extends Model {
    static associate(models) {
      Device.belongsTo(models.User, { foreignKey: "user_id", as: "users" });
    }
  }
  Device.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: DataTypes.INTEGER,
      name: DataTypes.STRING,
      browser: DataTypes.STRING,
      system: DataTypes.STRING,
      login_time: DataTypes.DATE,
      active_time: DataTypes.DATE,
      status: DataTypes.BOOLEAN,
      ip: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Device",
      timestamps: true,
      tableName: "devices",
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return Device;
};
