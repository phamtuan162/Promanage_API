"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Attachment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Attachment.belongsTo(models.Card, {
        foreignKey: "card_id",
        as: "card",
      });
      Attachment.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }
  Attachment.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      fileName: DataTypes.STRING,
      path: DataTypes.STRING,
      user_id: DataTypes.INTEGER,
      card_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Attachment",
      tableName: "attachments",
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return Attachment;
};
