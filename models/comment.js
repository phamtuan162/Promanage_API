"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Comment.belongsTo(models.Card, {
        foreignKey: "card_id",
        as: "card",
      });
      Comment.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }
  Comment.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      isEdit: DataTypes.BOOLEAN,
      userName: DataTypes.STRING,
      userAvatar: DataTypes.STRING,
      user_id: DataTypes.INTEGER,
      card_id: DataTypes.INTEGER,
      content: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Comment",
      tableName: "comments",
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return Comment;
};
