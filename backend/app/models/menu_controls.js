const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('menu_controls', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    menu_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    parent_key: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'active'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    }
  }, {
    sequelize,
    tableName: 'menu_controls',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "menu_controls_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "menu_controls_menu_key_key",
        unique: true,
        fields: [
          { name: "menu_key" },
        ]
      }
    ]
  });
};
