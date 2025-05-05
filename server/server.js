const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { setupSocket } = require('./services/socket');
const { subscribeGoldPrice } = require('./services/pubsub/subscriber');
const apiRoutes = require('./routes/api');
const { connectRedis } = require('./services/redis');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'client')));
app.use(express.json());

app.use('/api', apiRoutes);

async function startServer() {
  try {
    await connectRedis();
    await subscribeGoldPrice();
    setupSocket(server);

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Server startup error:', err.message);
    process.exit(1);
  }
}

startServer();