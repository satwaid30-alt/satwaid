const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('topic_likes', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    topic_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'topics',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    }
  }, {
    sequelize,
    tableName: 'topic_likes',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "topic_likes_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "topic_likes_unique",
        unique: true,
        fields: [
          { name: "topic_id" },
          { name: "user_id" },
        ]
      }
    ]
  });
};
