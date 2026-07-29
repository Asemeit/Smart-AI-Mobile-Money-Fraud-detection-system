import jwt from 'jsonwebtoken';

function attachUser(req, res, next, required) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    if (required) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    return next();
  }

  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    if (required) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    next();
  }
}

export function requireAuth(req, res, next) {
  return attachUser(req, res, next, true);
}

export function optionalAuth(req, res, next) {
  return attachUser(req, res, next, false);
}