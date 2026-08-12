const jwt = require('jsonwebtoken');

function authMiddleware(request, response, next) {
  const header = request.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return response.status(401).json({ success: false, message: 'Authentication token is required.' });
  const token = header.slice(7);
  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET || 'development_only_secret');
    next();
  } catch (error) {
    return response.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

module.exports = authMiddleware;
