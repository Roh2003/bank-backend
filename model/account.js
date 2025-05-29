const { DataTypes } = require('sequelize');
const sequelize = require('../db/connect');

const Account = sequelize.define('Account', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  Account_number: {
    type: DataTypes.STRING,
  },
  Account_type: {
    type: DataTypes.STRING,
  },
  Balance: {
    type: DataTypes.FLOAT,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'Accounts',
  timestamps: false,
});

module.exports = Account;
