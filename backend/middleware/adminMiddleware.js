function adminMiddleware(request, response, next) {
  if (!request.user || request.user.role !== 'admin') return response.status(403).json({ success: false, message: 'Administrator access required.' });
  next();
}

module.exports = adminMiddleware;
