const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Khởi tạo kết nối đến database
const db = new sqlite3.Database(path.resolve(__dirname, 'app.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Tạo bảng nếu chưa có
db.run(`
  CREATE TABLE IF NOT EXISTS data (
    gold_type TEXT NOT NULL,
    sell_price REAL NOT NULL,
    buy_price REAL NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (gold_type, updated_at)
  )
`, (err) => {
  if (err) {
    console.error('Error creating table:', err.message);
  } else {
    console.log('Table is ready.');
  }
});

module.exports = db;

