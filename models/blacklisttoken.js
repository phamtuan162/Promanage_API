"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class BlacklistToken extends Model {
    static associate(models) {}
  }
  BlacklistToken.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      token: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: "BlacklistToken",
      createdAt: "created_at",
      updatedAt: "updated_at",
      tableName: "blacklist_tokens",
    }
  );
  return BlacklistToken;
};
