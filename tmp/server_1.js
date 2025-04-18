const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors'); // 👈 Thêm dòng này

const { redisPublisher, redisSubscriber, connectRedis } = require('./redis');

const path = require('path');

const lib = require('./utils_1');

const app = express();
const port = 8080;
app.use(cors()); //Thêm dòng này để mở CORS cho tất cả các domain
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Hoặc cụ thể như: ['http://127.0.0.1:5500']
        methods: ['GET', 'POST']
    }
});

// Kết nối Redis trước khi khởi động server
connectRedis();

// Khi Redis nhận được message (từ kênh pub-sub)
redisSubscriber.subscribe('gold_channel', (message) => {
    const data = JSON.parse(message);
    console.log('📩 Redis received:', data);

    // Phát message ra cho tất cả client thông qua socket.io
    io.emit('gold_update', data);

    // Lưu vào database
    const { gold_type, buy_price, sell_price, updated_at } = data;
    lib.write(gold_type, sell_price, buy_price, updated_at)
        .then(() => console.log('💾 Saved to DB'))
        .catch(err => console.error('❌ DB error:', err));
});

app.post('/add', async (req, res) => {
    try {
        const { gold_type, sell_price, buy_price, updated_at } = req.body;
        const data = {
            gold_type,
            buy_price,
            sell_price,
            updated_at
        };
        await redisPublisher.publish('gold_channel', JSON.stringify(data));
        res.status(200).json({ message: '📤 Data published successfully' });
    } catch (err) {
        console.error('❌ Publish error:', err);
        res.status(500).json({ error: 'Failed to publish data' });
    }
});

// Lắng nghe Socket.io kết nối
io.on('connection', (socket) => {
    console.log('🟢 Client connected');

    socket.on('disconnect', () => {
        console.log('🔴 Client disconnected');
    });
});


app.get('/get-latest-price', async (req, res) => {
    try {
        const value = await lib.view_latest_price();
        console.log("update latest: ", value);
        res.status(200).send(value);
    } catch (err) {
        res.send(err)
    }
});
app.get('/getAll', async (req, res) => {
    try {
        const value = await lib.viewAll();
        res.status(200).send(value);
        console.log("GetAll");
    } catch (err) {
        res.send(err)
    }
});


app.get('/viewer/:id', (req, res) => {
    const id = req.params.id;
    res.sendFile(path.join(__dirname, "viewer.html"));
});


server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});