const { DataTypes } = require('sequelize');
const sequelize = require('../db');
import User from './user';

const transaction = sequelize.define('Accounts', {
    t_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users', // table name, not model name
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('admin', 'user'), 
        allowNull: false,
        defaultValue: 'user',
      }
  }, {
    tableName: 'Users',
    timestamps: true,
  });

  User.hasMany(transaction, { foreignKey: 'userId' });
  transaction.belongsTo(User, { foreignKey: 'userId' });


  
  module.exports = User;