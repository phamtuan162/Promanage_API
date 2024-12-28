"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Notification.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }
  Notification.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: DataTypes.INTEGER,
      content: DataTypes.STRING,
      type: DataTypes.STRING,
      userAvatar: DataTypes.STRING,
      userName: DataTypes.STRING,
      status: DataTypes.STRING,
      onClick: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Notification",
      tableName: "notifications",
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return Notification;
};
