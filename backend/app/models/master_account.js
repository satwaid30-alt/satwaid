const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = function (sequelize, DataTypes) {
  var masterAccount = sequelize.define('master_account', {
    id_account: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    id_user: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'master_user',
        key: 'id_user'
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        min: {
          args: 6,
          msg: "Password must be more than 6 characters"
        }
      }
    },
    create_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    last_update: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_admin: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    }
  }, {
    sequelize,
    tableName: 'master_account',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "master_account_pkey",
        unique: true,
        fields: [
          { name: "id_account" },
        ]
      },
    ],
    hooks: {
      beforeCreate: async function (user) {
        const salt = await bcrypt.genSalt(16, 'a');
        user.password = await bcrypt.hash(user.password, salt);
      },
      beforeUpdate: async function (user) {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(16, 'a');
          user.password = await bcrypt.hash(user.get('password'), salt);
        }
      },
    },
  });

  masterAccount.prototype.validPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  }

  return masterAccount;
};
