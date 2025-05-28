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


// Public Routes
router.post('/signup', authController.signup);
router.post('/signin', authController.login);


router.post('/creating-user', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Hash the password with bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Save hashed password instead of plain text
    const newUser = await User.create({
      name: username,
      email,
      password: hashedPassword,
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
    // Use Sequelize's findOne method to find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

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



router.get('/accounts', authenticateUser, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }

  const query = `
    SELECT 
      a.id,
      a.user_id,
      a.Account_number,
      a.Account_type,
      a.Balance,
      a.created_at,
      u.name AS user_name
    FROM Accounts a
    JOIN Users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
  `;

  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching accounts:', err);
      return res.status(500).json({ message: 'Error fetching account details' });
    }

    res.status(200).json({ accounts: results });
  });
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
    await sequelize.transaction(async (t) => {
      // Find the account with lock FOR UPDATE
      const account = await Account.findOne({
        where: { user_id: userId },
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      let balance = parseFloat(account.Balance);
      if (isNaN(balance)) balance = 0;

      if (type === 'Withdraw' && numericAmount > balance) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }

      const newBalance = type === 'Deposit' ? balance + numericAmount : balance - numericAmount;

      account.Balance = newBalance;
      await account.save({ transaction: t });

      res.status(200).json({
        message: `${type} successful`,
        newBalance,
      });
    });
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Transaction failed' });
    }
  }
});



router.get('/customer/account', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId;

    // If admin, return all accounts
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
        Balance: acc.Balance
      }));

      return res.json({ accounts: formatted });
    }

    // Else, return only this user's account
    let account = await Account.findOne({ where: { user_id: userId } });

    if (!account) {
      const randomAccountNumber = Math.floor(100000000 + Math.random() * 900000000);
      const accountTypes = ['Savings', 'Checking', 'Business'];
      const randomAccountType = accountTypes[Math.floor(Math.random() * accountTypes.length)];
      const randomBalance = (Math.random() * 10000).toFixed(2);

      account = await Account.create({
        user_id: userId,
        Account_number: randomAccountNumber,
        Account_type: randomAccountType,
        Balance: randomBalance,
      });
    }

    res.json(account);
  } catch (err) {
    console.error('Error handling account assignment:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});






module.exports = router;
