const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Khởi tạo Sequelize với SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.resolve(__dirname, 'app.db'),
    logging: false // Tắt log SQL, bạn có thể bật khi debug
});

// Định nghĩa model `Data`
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

// Hàm khởi tạo database
async function initializeDatabase() {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ force: false }); // force: false để không xóa dữ liệu
        console.log('Connected and synced with SQLite database.');
    } catch (err) {
        console.error('Unable to connect to the database:', err);
    }
}

// Gọi hàm khởi tạo
initializeDatabase();

// Export Sequelize instance và model để dùng ở nơi khác
module.exports = {
    sequelize,
    Data
};
