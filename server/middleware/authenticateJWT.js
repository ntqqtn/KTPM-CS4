const jwt = require('jsonwebtoken');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'security.log' })
  ]
});

const authenticateJWT = (req, res, next) => {
  const token = req.cookies.jwt_token;

  if (!token) {
    logger.warn('No JWT token found', { ip: req.ip });
    return res.status(401).json({ message: 'Không tìm thấy token, vui lòng đăng nhập lại' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    logger.info('Token verified successfully', { username: decoded.username, ip: req.ip });
    next();
  } catch (err) {
    logger.error('JWT verification error:', { message: err.message, ip: req.ip });
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Token đã hết hạn, vui lòng làm mới token' });
    }
    return res.status(403).json({ message: 'Token không hợp lệ' });
  }
};

module.exports = authenticateJWT;