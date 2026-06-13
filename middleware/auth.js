const jwt = require('jsonwebtoken');

const JWT_SECRET = 'secondhand-market-secret-key';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权，请先登录' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'token 无效或已过期' });
  }
}

module.exports = {
  authMiddleware,
  JWT_SECRET
};
