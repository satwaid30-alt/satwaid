const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('shop_upgrade_plans', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    sub_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    duration: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '/ 2 Bulan'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    features: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    badge: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    badge_color: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
    },
    popular: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    gradient: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: 'from-emerald-500/10 via-teal-500/5 to-zinc-900 hover:border-emerald-500/40'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'shop_upgrade_plans',
    schema: 'public',
    timestamps: false,
  });
};
