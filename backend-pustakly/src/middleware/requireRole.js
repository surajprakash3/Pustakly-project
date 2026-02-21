const requireRole = (role) => (req, res, next) => {
  const requiredRole = String(role || '').toLowerCase();
  const actualRole = String(req.user?.role || '').toLowerCase();
  if (!actualRole || actualRole !== requiredRole) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return next();
};

module.exports = requireRole;
