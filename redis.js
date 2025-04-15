// utils/redis.js
const { createClient } = require('redis');

// Ép Redis client dùng IPv4 để tránh lỗi ECONNREFUSED ::1
const redisClient = createClient({
    url: 'redis://127.0.0.1:6379'
});

const redisPublisher = redisClient.duplicate();
const redisSubscriber = redisClient.duplicate();

async function connectRedis() {
    try {
        await redisClient.connect();
        await redisPublisher.connect();
        await redisSubscriber.connect();
        console.log('✅ Redis connected successfully');
    } catch (err) {
        console.error('❌ Redis connection error:', err);
    }
}

module.exports = {
    redisClient,
    redisPublisher,
    redisSubscriber,
    connectRedis,
};
