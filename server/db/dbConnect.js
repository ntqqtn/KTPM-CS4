const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.resolve(__dirname, 'app.db'),
  logging: false
});

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

const Admin = sequelize.define('Admin', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mustChangePassword: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'admins',
  timestamps: false
});

const RefreshToken = sequelize.define('RefreshToken', {
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'refresh_tokens',
  timestamps: false
});

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: false });

    const adminCount = await Admin.count();
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await Admin.create({
        username: 'admin',
        password: hashedPassword,
        mustChangePassword: true
      });
      console.log('Created default admin (username: admin, password: admin123, must change password)');
    }

    console.log('Connected and synced with SQLite database');
  } catch (err) {
    console.error('Unable to connect to SQLite database:', err.message);
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
  RefreshToken
};