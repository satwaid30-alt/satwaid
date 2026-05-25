const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('listings', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    shop_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'shops',
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    product_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },
    species: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(20), // 'sell' or 'auction'
      allowNull: false
    },
    price: {
      type: DataTypes.BIGINT, // Using BIGINT for large prices without decimals
      allowNull: true
    },
    sex: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    shipping_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    images: {
      type: DataTypes.JSONB, 
      allowNull: true
    },
    // Auction specific fields
    start_bid: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    multiple: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    bin_price: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending' // active, sold, ended, pending, rejected
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    view_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    is_free_shipping: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_free_packing: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    shipping_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
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
    sold_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Waktu produk terjual habis'
    }
  }, {
    sequelize,
    tableName: 'listings',
    schema: 'public',
    timestamps: false,
  });
};
