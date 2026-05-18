const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const { hashPasswordWithMD5 } = require('../helpers/App.helper');

module.exports = function (sequelize, DataTypes) {
  var masterAccount = sequelize.define('users', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    nip: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },
    phone: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    province: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    bank_accounts: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    avatar_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [4, 255],
          msg: "Password must be between 4 and 255 characters"
        }
      }
    },
    school_id: {
      type: DataTypes.UUID,
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
    },
    role: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    npsn: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cadisdik: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    is_change_password: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    finish_paps: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    finish_by_sk_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    finish_by_sk_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    finish_by_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    finish_by_nip: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'active'
    }
  }, {
    sequelize,
    tableName: 'users',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
    indexes: [
      {
        name: "users_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ],
    hooks: {
      beforeCreate: async function (user) {
        // const salt = await bcrypt.genSalt(10, 'a');
        user.password = hashPasswordWithMD5(user.password);
      },
      beforeUpdate: async function (user) {
        if (user.changed('password')) {
          // const salt = await bcrypt.genSalt(10, 'a');
          user.password = hashPasswordWithMD5(user.get('password'));
        }
      },
    },
  });

  masterAccount.prototype.validPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  }

  masterAccount.prototype.validPasswordMD5 = async function (password) {
    console.log(this.password, password, hashPasswordWithMD5(password));
    return hashPasswordWithMD5(password) === this.password;
  }

  return masterAccount;
};
