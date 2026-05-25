const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('advertisements', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    placement: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: 'Promo Mitra Reptile'
    },
    badge: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'PROMO EKSKLUSIF'
    },
    button_text: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'Klaim Promo Sekarang'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    mobile_image_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    link_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'Aktif'
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
    tableName: 'advertisements',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "advertisements_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
