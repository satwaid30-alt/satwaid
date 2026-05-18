const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('morph_groups', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    species_id: {
      type: DataTypes.STRING(100),
      allowNull: false
    },

    group_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    items: {
      type: DataTypes.JSONB,
      allowNull: true // Array of morph items
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'morph_groups',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "morph_groups_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      }
    ]
  });
};
