const express = require('express');
const router = express.Router();
const GoldPriceManageController = require('../controllers/goldPriceManage.controller');
const authenticateJWT = require('../middleware/authenticateJWT');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Admin, RefreshToken } = require('../db/dbConnect');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'security.log' })
  ]
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: '15m'
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id, username: user.username }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d'
  });
};

router.post('/login', limiter, async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Tên đăng nhập và mật khẩu là bắt buộc' });
    }

    const admin = await Admin.findOne({ where: { username } });
    if (!admin) {
      logger.warn('Login attempt failed: Admin not found', { username, ip: req.ip });
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      logger.warn('Login attempt failed: Incorrect password', { username, ip: req.ip });
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // Kiểm tra nếu đây là lần đầu đăng nhập và mật khẩu cần thay đổi
    if (admin.mustChangePassword) {
      logger.info('First login detected, requiring password change', { username, ip: req.ip });
      const accessToken = generateAccessToken(admin);
      res.cookie('jwt_token', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
      return res.status(200).json({
        message: 'Vui lòng thay đổi mật khẩu mặc định trước khi tiếp tục',
        mustChangePassword: true,
        username: admin.username
      });
    }

    const accessToken = generateAccessToken(admin);
    const refreshToken = generateRefreshToken(admin);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    // Kiểm tra và giới hạn số phiên (tối đa 5 phiên)
    const activeSessions = await RefreshToken.count({ where: { adminId: admin.id } });
    if (activeSessions >= 5) {
      // Xóa phiên cũ nhất
      const oldestToken = await RefreshToken.findOne({
        where: { adminId: admin.id },
        order: [['expiresAt', 'ASC']]
      });
      if (oldestToken) {
        await RefreshToken.destroy({ where: { id: oldestToken.id } });
        logger.info('Removed oldest session due to session limit', { username, ip: req.ip });
      }
    }

    await RefreshToken.create({
      token: hashedRefreshToken,
      adminId: admin.id,
      username: admin.username,
      expiresAt: expiresAt,
      ip: req.ip
    });

    res.cookie('jwt_token', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });

    logger.info('Login successful', { username: admin.username, ip: req.ip });
    res.status(200).json({ message: 'Đăng nhập thành công' });
  } catch (err) {
    logger.error('Login error:', { message: err.message, ip: req.ip });
    res.status(500).json({ message: `Lỗi server: ${err.message}` });
  }
});

// Route để thay đổi mật khẩu
router.post('/change-password', authenticateJWT, async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  try {
    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Tất cả các trường là bắt buộc' });
    }

    const admin = await Admin.findOne({ where: { username } });
    if (!admin) {
      return res.status(401).json({ message: 'Người dùng không tồn tại' });
    }

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mật khẩu cũ không đúng' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await Admin.update(
      { password: hashedNewPassword, mustChangePassword: false },
      { where: { id: admin.id } }
    );

    logger.info('Password changed successfully', { username, ip: req.ip });
    res.status(200).json({ message: 'Mật khẩu đã được thay đổi thành công' });
  } catch (err) {
    logger.error('Change password error:', { message: err.message, ip: req.ip });
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.post('/register-admin', authenticateJWT, async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Tên đăng nhập và mật khẩu là bắt buộc' });
    }

    const existingAdmin = await Admin.findOne({ where: { username } });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await Admin.create({ username, password: hashedPassword });

    res.status(201).json({ message: 'Đăng ký quản trị viên thành công' });
  } catch (err) {
    logger.error('Register admin error:', { message: err.message, ip: req.ip });
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.post('/refresh-token', async (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    logger.warn('No refresh token found', { ip: req.ip });
    return res.status(401).json({ message: 'Không tìm thấy refresh token' });
  }

  try {
    const storedToken = await RefreshToken.findOne({ where: { token: refreshToken } });
    if (!storedToken) {
      logger.warn('Refresh token not found in database', { ip: req.ip });
      return res.status(403).json({ message: 'Refresh token không hợp lệ' });
    }

    const currentTime = new Date();
    if (storedToken.expiresAt < currentTime) {
      await RefreshToken.destroy({ where: { token: refreshToken } });
      logger.warn('Refresh token expired', { ip: req.ip, expiresAt: storedToken.expiresAt });
      return res.status(403).json({ message: 'Refresh token đã hết hạn' });
    }

    const isMatch = await bcrypt.compare(refreshToken, storedToken.token);
    if (!isMatch) {
      logger.warn('Refresh token mismatch', { ip: req.ip });
      return res.status(403).json({ message: 'Refresh token không hợp lệ' });
    }

    if (storedToken.ip !== req.ip) {
      logger.warn('IP mismatch during refresh', { storedIp: storedToken.ip, currentIp: req.ip });
      return res.status(403).json({ message: 'IP không khớp' });
    }

    const user = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const admin = await Admin.findOne({ where: { id: user.id } });

    if (!admin) {
      logger.warn('Admin not found for user ID', { id: user.id, ip: req.ip });
      return res.status(403).json({ message: 'Người dùng không tồn tại' });
    }

    const newAccessToken = generateAccessToken(admin);
    const newRefreshToken = generateRefreshToken(admin);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);

    await RefreshToken.destroy({ where: { token: refreshToken } });
    await RefreshToken.create({
      token: hashedNewRefreshToken,
      adminId: admin.id,
      username: admin.username,
      expiresAt: expiresAt,
      ip: req.ip
    });

    res.cookie('jwt_token', newAccessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    res.cookie('refresh_token', newRefreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });

    logger.info('Token refresh successful', { username: admin.username, ip: req.ip });
    res.status(200).json({ message: 'Token đã được làm mới' });
  } catch (err) {
    logger.error('Refresh token error:', { message: err.message, ip: req.ip });
    res.status(403).json({ message: 'Refresh token không hợp lệ' });
  }
});

router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  try {
    if (refreshToken) {
      await RefreshToken.destroy({ where: { token: refreshToken } });
    }

    res.clearCookie('jwt_token');
    res.clearCookie('refresh_token');
    logger.info('Logout successful', { ip: req.ip });
    res.status(200).json({ message: 'Đăng xuất thành công' });
  } catch (err) {
    logger.error('Logout error:', { message: err.message, ip: req.ip });
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.get('/check-auth', authenticateJWT, async (req, res) => {
  try {
    logger.info('Authentication check successful', { username: req.user.username, ip: req.ip });
    res.status(200).json({ message: 'Authenticated' });
  } catch (err) {
    logger.warn('Authentication check failed', { ip: req.ip });
    res.status(401).json({ message: 'Unauthorized' });
  }
});

router.get('/latest-gold-price', GoldPriceManageController.getLatestGoldPrice);
router.post('/admin-add', authenticateJWT, GoldPriceManageController.addGoldPrice);
router.delete('/admin-delete', authenticateJWT, GoldPriceManageController.deleteGoldType);
router.get('/price-with-date/:date', GoldPriceManageController.getPriceWithDate);

module.exports = router;