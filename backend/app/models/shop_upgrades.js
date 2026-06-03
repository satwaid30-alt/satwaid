const Sequelize = require("sequelize");

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "shop_upgrades",
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      shop_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "shops",
          key: "id",
        },
      },
      plan_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      plan_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      account_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      bank_origin: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      payment_proof: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      unique_code: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "pending_verification", // pending_verification, approved, rejected
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: Sequelize.Sequelize.fn("now"),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "shop_upgrades",
      schema: "public",
      timestamps: false,
    },
  );
};
