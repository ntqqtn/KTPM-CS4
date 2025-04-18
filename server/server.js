const express = require('express');
const http = require('http');
const cors = require("cors");
const { setupSocket } = require('./services/socket.js');
const { subscribeGoldPrice } = require('./services/pubsub/subscriber.js');
const apiRoutes = require('./routes/api.js');
const { connectRedis } = require('./services/redis.js');

const app = express();
app.use(cors());
const server = http.createServer(app);

setupSocket(server);

app.use(express.json());
app.use('/api', apiRoutes);

connectRedis();
subscribeGoldPrice();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
