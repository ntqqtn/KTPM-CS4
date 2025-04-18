const { publisher } = require('../redis.js');

async function publishGoldPrice(data) {
  try {
    await publisher.publish('gold-price-channel', JSON.stringify(data));
    console.log('Published to Redis:', data);
  } catch (error) {
    console.error('Error publishing to Redis:', error);
  }
}

module.exports = {publishGoldPrice};