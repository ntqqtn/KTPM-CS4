const { publisher } = require('../redis');

// Hàm xuất bản thông điệp giá vàng
async function publishGoldPrice(data) {
  try {
    await publisher.publish('gold-price-channel', JSON.stringify(data));
    console.log(`Published to Redis: action=${data.action}, gold_type=${data.gold_type}`);
  } catch (err) {
    console.error('Error publishing to Redis:', err.message);
    throw new Error('Publish failed');
  }
}

module.exports = { publishGoldPrice };