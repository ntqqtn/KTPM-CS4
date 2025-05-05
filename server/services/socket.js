let io = null;

// Hàm thiết lập Socket.IO
function setupSocket(server) {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: '*',
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.on('disconnect', () => console.log(`Client disconnected: ${socket.id}`));
  });
}

// Hàm phát thông báo cập nhật giá vàng
function emitGoldPriceUpdate(data) {
  if (io) {
    io.emit('gold_update', data);
    console.log(`Emitted gold_update: action=${data.action}`);
  }
}

module.exports = { setupSocket, emitGoldPriceUpdate };