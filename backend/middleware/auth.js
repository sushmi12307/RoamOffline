const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET || 'dev_secret'); next(); }
  catch { res.status(401).json({ error: 'Please log in again' }); }
};
