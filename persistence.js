const { Sequelize, DataTypes } = require('sequelize');

// Khởi tạo kết nối Sequelize với SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './db/app.db',
    logging: false
});
// Định nghĩa mô hình Data
const Data = sequelize.define('Data', {
    gold_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sell_price: {
        type: DataTypes.REAL,
        allowNull: false
    },
    buy_price: {
        type: DataTypes.REAL,
        allowNull: false
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'data',
    indexes: [
        {
            unique: true,
            fields: ['gold_type', 'updated_at']
        }
    ],
    timestamps: false
});

// Đồng bộ mô hình với cơ sở dữ liệu
async function initializeDatabase() {
    try {
        await sequelize.sync({ force: false }); // force: false để không xóa bảng hiện có
        console.log('Database synchronized');
    } catch (err) {
        console.error('Error syncing database:', err);
    }
}

// Gọi hàm khởi tạo
initializeDatabase();

// Hàm thêm hoặc cập nhật dữ liệu
async function write(gold_type, sell_price, buy_price, updated_at) {
    try {
        if (!gold_type || typeof sell_price !== 'number' || typeof buy_price !== 'number' || !updated_at) {
            throw new Error('Dữ liệu không hợp lệ');
        }

        const [record, created] = await Data.upsert({
            gold_type,
            sell_price,
            buy_price,
            updated_at: new Date(updated_at)
        }, {
            conflictFields: ['gold_type', 'updated_at']
        });

        return created ? record.id : record.id;
    } catch (err) {
        throw new Error(err.message);
    }
}

// Hàm cập nhật nhiều bản ghi
async function updateGoldPrices(dataArray) {
    try {
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            throw new Error('Dữ liệu không hợp lệ hoặc rỗng.');
        }

        const promises = dataArray.map(item => {
            if (!item.gold_type || typeof item.sell_price !== 'number' || typeof item.buy_price !== 'number' || !item.updated_at) {
                throw new Error('Dữ liệu không hợp lệ.');
            }
            return Data.upsert({
                gold_type: item.gold_type,
                sell_price: item.sell_price,
                buy_price: item.buy_price,
                updated_at: new Date(item.updated_at)
            }, {
                conflictFields: ['gold_type', 'updated_at']
            });
        });

        await Promise.all(promises);
        return `Đã cập nhật ${dataArray.length} dòng`;
    } catch (err) {
        throw new Error(err.message);
    }
}

// Hàm lấy dữ liệu mới nhất của mỗi loại vàng
async function view_latest_price() {
    try {
        const records = await Data.findAll({
            attributes: ['gold_type', 'sell_price', 'buy_price', 'updated_at'],
            where: sequelize.literal(`(gold_type, updated_at) IN (
                SELECT gold_type, MAX(updated_at)
                FROM data
                GROUP BY gold_type
            )`),
            order: [['gold_type', 'ASC']],
            raw: true
        });
        return records;
    } catch (err) {
        throw new Error(err.message);
    }
}

// Hàm lấy dữ liệu mới nhất của mỗi loại vàng trong một ngày cụ thể
async function view_by_date(date) {
    try {
        const formattedDate = new Date(date).toISOString().split('T')[0];
        const records = await Data.findAll({
            attributes: ['gold_type', 'sell_price', 'buy_price', 'updated_at'],
            where: sequelize.literal(`(gold_type, updated_at) IN (
                SELECT gold_type, MAX(updated_at)
                FROM data
                WHERE DATE(updated_at) = '${formattedDate}'
                GROUP BY gold_type
            )`),
            order: [['gold_type', 'ASC']],
            raw: true
        });
        return records;
    } catch (err) {
        throw new Error(err.message);
    }
}

// Hàm lấy dữ liệu mới nhất của mỗi loại vàng trong ngày hôm qua
async function view_yesterday_price() {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const formattedDate = yesterday.toISOString().split('T')[0];
        const records = await Data.findAll({
            attributes: ['gold_type', 'sell_price', 'buy_price', 'updated_at'],
            where: sequelize.literal(`(gold_type, updated_at) IN (
                SELECT gold_type, MAX(updated_at)
                FROM data
                WHERE DATE(updated_at) = '${formattedDate}'
                GROUP BY gold_type
            )`),
            order: [['gold_type', 'ASC']],
            raw: true
        });
        return records;
    } catch (err) {
        throw new Error(err.message);
    }
}

// Hàm lấy tất cả dữ liệu
async function viewAll() {
    try {
        const records = await Data.findAll({
            order: [['updated_at', 'DESC']],
            raw: true
        });
        return records;
    } catch (err) {
        throw new Error(err.message);
    }
}

// Hàm lấy danh sách tất cả các loại vàng duy nhất
async function get_all_gold_types() {
    try {
        const records = await Data.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('gold_type')), 'gold_type']],
            raw: true
        });
        return records.map(record => record.gold_type);
    } catch (err) {
        throw new Error(err.message);
    }
}

// Hàm xóa tất cả bản ghi theo gold_type
async function deleteByGoldType(gold_type) {
    try {
        if (!gold_type) {
            throw new Error('gold_type không hợp lệ');
        }
        const deletedCount = await Data.destroy({
            where: { gold_type }
        });
        return deletedCount;
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = {
    write,
    updateGoldPrices,
    view_latest_price,
    view_by_date,
    view_yesterday_price,
    viewAll,
    get_all_gold_types,
    deleteByGoldType
};