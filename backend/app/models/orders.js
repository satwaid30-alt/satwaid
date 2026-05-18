const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('orders', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    order_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    listing_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'listings',
        key: 'id'
      }
    },
    shop_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'shops',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    price: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    total_price: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'pending_shipping_info' // pending_shipping_info, waiting_shipping_cost, waiting_payment, processing, shipped, completed, cancelled
    },
    receiver_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    shipping_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    shipping_cost: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0
    },
    packing_cost: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0
    },
    admin_fee: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0
    },
    tracking_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    bank_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    bank_account: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    bank_holder: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    payment_proof: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    shipping_proof: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    disbursement_proof: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Bukti transfer dari admin ke seller'
    },
    disbursement_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Catatan dari admin saat pencairan dana'
    },
    additional_fee: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0,
      comment: 'Biaya tambahan/potongan transfer yang diinput admin'
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
    // === STAGE TIMESTAMPS (otomatis diisi backend) ===
    address_filled_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Waktu pembeli mengisi data pengiriman'
    },
    shipping_cost_set_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Waktu seller menetapkan ongkos kirim'
    },
    payment_uploaded_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Waktu pembeli mengunggah bukti bayar'
    },
    payment_verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Waktu admin memverifikasi pembayaran'
    },
    shipped_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Waktu seller menginput resi dan mengirim barang'
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Waktu pembeli mengonfirmasi penerimaan barang'
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Waktu pesanan dibatalkan'
    },
    disbursed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Waktu admin mencairkan dana ke seller'
    },
    disbursement_requested_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Waktu seller mengajukan pencairan dana'
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    review: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    complaint_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    complaint_image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Alasan pembatalan dari penjual'
    }
  }, {
    sequelize,
    tableName: 'orders',
    schema: 'public',
    timestamps: false,
  });
};
