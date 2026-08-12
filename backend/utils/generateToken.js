const jwt = require('jsonwebtoken');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'development_only_secret',
    { expiresIn: '8h' },
  );
}

module.exports = generateToken;
