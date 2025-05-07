const { Sequelize, DataTypes } = require('sequelize');
const mysql = require('mysql2/promise'); // Thêm thư viện mysql2
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createDatabaseIfNotExists() {
  try {
    // Kết nối ban đầu để kiểm tra và tạo cơ sở dữ liệu
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      pool: {
        max: Number(process.env.DB_POOL_MAX),
        min: Number(process.env.DB_POOL_MIN),
        acquire: Number(process.env.DB_POOL_ACQUIRE),
        idle: Number(process.env.DB_POOL_IDLE),
      },
    });

    await connection.query('CREATE DATABASE IF NOT EXISTS gold_price');
    console.log('Database "gold_price" checked/created successfully.');
    await connection.end();
  } catch (err) {
    console.error('Error creating database:', err.message);
    throw new Error('Database creation failed');
  }
}

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'qqqqqqqqqq',
  database: 'gold_price',
  logging: false, // Tắt log SQL
});

const Data = sequelize.define('Data', {
  gold_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sell_price: {
    type: DataTypes.REAL,
    allowNull: false,
  },
  buy_price: {
    type: DataTypes.REAL,
    allowNull: false,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'data',
  indexes: [
    {
      unique: true,
      fields: ['gold_type', 'updated_at'],
    },
  ],
  timestamps: false,
});

const Admin = sequelize.define('Admin', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mustChangePassword: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'admins',
  timestamps: false,
});

const RefreshToken = sequelize.define('RefreshToken', {
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'refresh_tokens',
  timestamps: false,
});

async function initializeDatabase() {
  try {
    await createDatabaseIfNotExists(); // Gọi hàm kiểm tra/tạo cơ sở dữ liệu
    await sequelize.authenticate();
    await sequelize.sync({ force: false });

    const adminCount = await Admin.count();
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await Admin.create({
        username: 'admin',
        password: hashedPassword,
        mustChangePassword: true,
      });
      console.log('Created default admin (username: admin, password: admin123, must change password)');
    }

    console.log('Connected and synced with MySQL database');
  } catch (err) {
    console.error('Unable to connect to MySQL database:', err.message);
    throw new Error('Database initialization failed');
  }
}

initializeDatabase().catch(err => {
  console.error('Initialization error:', err.message);
  process.exit(1);
});

module.exports = {
  sequelize,
  Data,
  Admin,
  RefreshToken,
};