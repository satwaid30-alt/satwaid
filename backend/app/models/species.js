const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('species', {
    id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      primaryKey: true
    },

    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    scientificName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    lifespan: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    size: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    origin: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    diet: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    habitat: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    careTips: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    healthIssues: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    breedingGuide: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    morphGroups: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    references: {
      type: DataTypes.JSONB,
      allowNull: true
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
    tableName: 'species',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "species_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "species_slug_key",
        unique: true,
        fields: [
          { name: "slug" },
        ]
      },
    ]
  });
};
