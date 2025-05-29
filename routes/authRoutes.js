const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');
const { authenticateUser } = require('../middlewares/authMiddleware');
const bcrypt = require('bcrypt');
const pool = require('../db/connect')
const User = require('../model/user')
const Account = require('../model/account')
const jwt = require('jsonwebtoken')
const sequelize = require('../db/connect');


router.post('/signup', authController.signup);
router.post('/signin', authController.login);


router.post('/creating-user', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const role = email.endsWith('@enpointe.io') ? 'admin' : 'user';

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);


    const newUser = await User.create({
      name: username,
      email,
      password: hashedPassword,
      role,               
    });

    res.status(201).json({
      message: 'User created successfully',
      data: newUser,
    });
  } catch (error) {
    console.error('Error inserting data:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    res.status(500).json({ message: 'Database insertion error', error });
  }
});


router.post('/check-user', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },  
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error in /check-user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



router.get('/banker/accounts', authenticateUser, async (req, res) => {
  try {
    console.log('GET /banker/accounts hit');
    console.log('User info:', req.user);

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    const query = `
      SELECT 
        id,
        user_id,
        Account_number,
        Account_type,
        Balance,
        created_at
      FROM Accounts
      ORDER BY created_at DESC
    `;

    pool.query(query, (err, results) => {
      if (err) {
        console.error('Error executing SQL:', err);
        return res.status(500).json({ message: 'Failed to fetch accounts', error: err.message });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'No accounts found' });
      }

      console.log('Accounts fetched:', results.length);
      res.status(200).json({ accounts: results });
    });

  } catch (err) {
    console.error('Unexpected error in /banker/accounts:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});



router.post('/customer/transaction', authenticateUser, async (req, res) => {
  const userId = req.user.userId;
  const { type, amount } = req.body;

  if (!['Deposit', 'Withdraw'].includes(type)) {
    return res.status(400).json({ message: 'Invalid transaction type' });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  try {
    const result = await sequelize.transaction(async (t) => {

      const account = await Account.findOne({
        where: { user_id: userId },
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!account) {
        
        const err = new Error('Account not found');
        err.status = 404;
        throw err;
      }

      let balance = parseFloat(account.Balance);
      if (isNaN(balance)) balance = 0;

      if (type === 'Withdraw' && numericAmount > balance) {
        const err = new Error('Insufficient balance');
        err.status = 400;
        throw err;
      }

      const newBalance = parseFloat(
        (type === 'Deposit' ? balance + numericAmount : balance - numericAmount).toFixed(2)
      );

      account.Balance = newBalance;
      await account.save({ transaction: t });

      return newBalance;
    });

    res.status(200).json({
      message: `${type} successful`,
      newBalance: result,
    });

  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ message: error.message || 'Transaction failed' });
  }
});




router.get('/customer/account', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.headers.authorization === 'Bearer admin-token') {
      const accounts = await Account.findAll({
        include: [{ model: User, attributes: ['name'] }]
      });

      const formatted = accounts.map(acc => ({
        id: acc.id,
        user_id: acc.user_id,
        user_name: acc.User.name,
        Account_number: acc.Account_number,
        Account_type: acc.Account_type,
        Balance: Number(acc.Balance),   
      }));

      return res.json({ accounts: formatted });
    }

    let account = await Account.findOne({ where: { user_id: userId } });

    if (!account) {
      const randomAccountNumber = Math.floor(100000000 + Math.random() * 900000000);
      const accountTypes = ['Savings', 'Checking', 'Business'];
      const randomAccountType = accountTypes[Math.floor(Math.random() * accountTypes.length)];

      account = await Account.create({
        user_id: userId,
        Account_number: randomAccountNumber,
        Account_type: randomAccountType,
        Balance: 0,   
      });
    }


    const responseAccount = {
      id: account.id,
      user_id: account.user_id,
      Account_number: account.Account_number,
      Account_type: account.Account_type,
      Balance: Number(account.Balance),
    };

    res.json(responseAccount);

  } catch (err) {
    console.error('Error handling account assignment:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});







module.exports = router;
