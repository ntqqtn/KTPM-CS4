const { subscriber } = require('../redis.js');
const { emitGoldPriceUpdate } = require('../socket.js');

async function subscribeGoldPrice() {
  try {
    await subscriber.subscribe('gold-price-channel', (message) => {
      const data = JSON.parse(message);
      console.log('Received from Redis:', data);
      emitGoldPriceUpdate(data);
    });
  } catch (error) {
    console.error('Error subscribing to Redis channel:', error);
  }
}

module.exports = { subscribeGoldPrice };
