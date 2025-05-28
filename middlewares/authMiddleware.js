const jwt = require('jsonwebtoken');
const User = require('../model/user');

exports.authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  if (token === 'admin-token') {
    // For admin token, skip verification and set req.user manually
    req.user = { userId: 0, role: 'admin' }; // dummy admin user id and role
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    req.user = decoded;

    // Find user by ID using Sequelize
    const user = await User.findOne({ where: { id: decoded.userId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user.role = user.role;

    next();
  } catch (err) {
    console.error('JWT Error:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
};
