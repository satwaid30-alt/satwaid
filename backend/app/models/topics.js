const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('topics', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'Aktif'
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    replies: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    likes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
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
    tableName: 'topics',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "topics_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
