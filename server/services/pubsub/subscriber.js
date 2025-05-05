const { subscriber } = require('../redis');
const { emitGoldPriceUpdate } = require('../socket');

// Hàm đăng ký kênh giá vàng
async function subscribeGoldPrice() {
  try {
    await subscriber.subscribe('gold-price-channel', (message) => {
      const data = JSON.parse(message);
      console.log(`Received from Redis: action=${data.action}, gold_type=${data.gold_type}`);
      emitGoldPriceUpdate(data);
    });
  } catch (err) {
    console.error('Error subscribing to Redis:', err.message);
    throw new Error('Subscribe failed');
  }
}

module.exports = { subscribeGoldPrice };