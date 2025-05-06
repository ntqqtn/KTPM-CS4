let io = null;

function setupSocket(server) {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
  });
}

function emitGoldPriceUpdate(data) {
  if (io) {
    console.log("data emit", data);
    io.emit('gold-price-update', data);
  }
}

module.exports = { setupSocket, emitGoldPriceUpdate };
