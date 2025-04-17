const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');

const { redisPublisher, redisSubscriber, connectRedis } = require('./redis');
const lib = require('./persistence');

const path = require('path');

const app = express();
const port = 8080;
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(bodyParser.json());

// Phục vụ các file tĩnh (HTML, CSS, JS)
app.use(express.static(__dirname));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'DELETE']
    }
});

// Kết nối Redis trước khi khởi động server
connectRedis();

// Khi Redis nhận được message (từ kênh pub-sub)
redisSubscriber.subscribe('gold_channel', (message) => {
    const data = JSON.parse(message);
    console.log('📩 Redis received:', data);

    // Chuyển gold_type thành chữ hoa trước khi lưu
    data.gold_type = data.gold_type.toUpperCase();

    io.emit('gold_update', data);

    const { gold_type, buy_price, sell_price, updated_at } = data;
    lib.write(gold_type, sell_price, buy_price, updated_at)
        .then(() => console.log('💾 Saved to DB'))
        .catch(err => console.error('❌ DB error:', err));
});

app.post('/add', async (req, res) => {
    try {
        const { gold_type, sell_price, buy_price, updated_at } = req.body;

        if (!gold_type || typeof sell_price !== 'number' || typeof buy_price !== 'number' || !updated_at) {
            return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
        }

        const data = {
            gold_type: gold_type.toUpperCase(),
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

app.get('/get-latest-price', async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        let value = await lib.view_by_date(date);

        if (!value || value.length === 0) {
            // Nếu không có dữ liệu trong ngày được chọn, lấy dữ liệu mới nhất
            value = await lib.view_latest_price();
        } else {
            // Lấy tất cả các loại vàng có trong database
            const allGoldTypes = await lib.get_all_gold_types();
            const goldTypesInDate = new Set(value.map(item => item.gold_type));
            const missingGoldTypes = allGoldTypes.filter(type => !goldTypesInDate.has(type));

            // Lấy dữ liệu mới nhất cho các loại vàng bị thiếu
            if (missingGoldTypes.length > 0) {
                const latestData = await lib.view_latest_price();
                const missingData = latestData.filter(item => missingGoldTypes.includes(item.gold_type));
                value = [...value, ...missingData];
            }
        }

        // Sắp xếp theo gold_type để hiển thị nhất quán
        value.sort((a, b) => a.gold_type.localeCompare(b.gold_type));

        console.log("update latest: ", value);
        res.status(200).send(value);
    } catch (err) {
        console.error('Error in /get-latest-price:', err.message);
        res.status(500).send({ error: err.message });
    }
});

app.get('/get-yesterday-price', async (req, res) => {
    try {
        const value = await lib.view_yesterday_price();
        console.log("yesterday price: ", value);
        res.status(200).send(value);
    } catch (err) {
        console.error('Error in /get-yesterday-price:', err.message);
        res.status(500).send({ error: err.message });
    }
});

app.get('/getAll', async (req, res) => {
    try {
        const value = await lib.viewAll();
        res.status(200).send(value);
        console.log("GetAll");
    } catch (err) {
        console.error('Error in /getAll:', err.message);
        res.status(500).send({ error: err.message });
    }
});

app.delete('/delete-gold-type', async (req, res) => {
    try {
        const { gold_type } = req.body;

        if (!gold_type) {
            return res.status(400).json({ error: 'gold_type không hợp lệ' });
        }

        const upperGoldType = gold_type.toUpperCase();
        const deletedCount = await lib.deleteByGoldType(upperGoldType);
        if (deletedCount === 0) {
            return res.status(404).json({ error: `Không tìm thấy dữ liệu cho ${upperGoldType}` });
        }

        // Thông báo cập nhật qua Socket.IO
        io.emit('gold_update', { gold_type: upperGoldType, deleted: true });
        res.status(200).json({ message: `Đã xóa ${deletedCount} bản ghi cho ${upperGoldType}` });
    } catch (err) {
        console.error('❌ Delete error in /delete-gold-type:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/viewer/:id', (req, res) => {
    const id = req.params.id;
    res.sendFile(path.join(__dirname, "server.html"));
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});