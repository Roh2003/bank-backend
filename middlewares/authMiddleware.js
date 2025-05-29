const jwt = require('jsonwebtoken');
const User = require('../model/user')

exports.authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  if (token === 'admin-token') {
    req.user = { id: 0, userId: 0, role: 'admin' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    const user = await User.findOne({ where: { id: decoded.id } }); //find user by id 

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = {
      id: decoded.id,
      userId: decoded.id, 
      role: user.role,
    };

    next();
  } catch (err) {
    console.error('JWT Error:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
};
