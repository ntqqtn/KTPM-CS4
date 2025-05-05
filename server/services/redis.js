const redis = require('redis');

const publisher = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
const subscriber = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Hàm kết nối Redis với retry
async function connectRedis() {
  try {
    await publisher.connect();
    await subscriber.connect();
    console.log('Redis connected successfully');
  } catch (err) {
    console.error('Redis connection error:', err.message);
    throw new Error('Redis initialization failed');
  }
}

module.exports = {
  publisher,
  subscriber,
  connectRedis
};