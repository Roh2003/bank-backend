const User = require('./user');
const Account = require('./account');
const Transaction = require('./transaction');


User.hasMany(Account, {
  foreignKey: 'user_id',
  as: 'Accounts'
});
Account.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'AccountOwner' 
});


User.hasMany(Transaction, {
  foreignKey: 'user_id',
  as: 'Transactions'
});
Transaction.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'TransactionOwner' 
});


Account.hasMany(Transaction, {
  foreignKey: 'id',
  as: 'AccountTransactions'
});
Transaction.belongsTo(Account, {
  foreignKey: 'id',
  as: 'TransactionAccount'
});

module.exports = {
  User,
  Account,
  Transaction
};
