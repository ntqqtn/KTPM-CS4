const redis = require('redis');

const publisher = redis.createClient();
const subscriber = redis.createClient();

async function connectRedis() {
    try {
        await publisher.connect();
        await subscriber.connect();
        console.log('✅ Redis connected successfully');
    } catch (err) {
        console.error('❌ Redis connection error:', err);
    }
}

module.exports = {
    publisher, subscriber, connectRedis
};