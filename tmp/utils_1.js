const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/app.db');

db.run(`
        CREATE TABLE IF NOT EXISTS data (
            gold_type TEXT NOT NULL,
            sell_price REAL NOT NULL,
            buy_price REAL NOT NULL,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (gold_type, updated_at)
    )`);

function write(gold_type, sell_price, buy_price, updated_at) {
    return new Promise((resolve, reject) => {
        return db.run(`
            INSERT INTO data (gold_type, sell_price, buy_price, updated_at) 
                VALUES ("${gold_type}", "${sell_price}", "${buy_price}", "${updated_at}")
        `, [], function (err) {
            if (err) {
                return reject(err.message);
            }
            return resolve(this.lastID);
        });
    });
}

function updateGoldPrices(dataArray) {
    return new Promise((resolve, reject) => {
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return reject("Dữ liệu không hợp lệ hoặc rỗng.");
        }

        const placeholders = dataArray.map(() => `(?, ?, ?, ?)`).join(', ');
        const values = [];

        for (const item of dataArray) {
            values.push(
                item.gold_type,
                item.sell_price,
                item.buy_price,
                item.updated_at
            );
        }

        const sql = `
            INSERT INTO data (gold_type, sell_price, buy_price, updated_at)
            VALUES ${placeholders}
            ON CONFLICT(gold_type) DO UPDATE SET
                sell_price = excluded.sell_price,
                buy_price = excluded.buy_price,
                updated_at = excluded.updated_at
        `;

        db.run(sql, values, function (err) {
            if (err) {
                return reject(err.message);
            }
            return resolve(`Đã cập nhật ${dataArray.length} dòng`);
        });
    });
}

function view_latest_price() {
    return new Promise((resolve, reject) => {
        db.get(`
            SELECT *
                FROM data
                WHERE updated_at = (
                    SELECT MAX(updated_at) FROM data
                );
        `, [], function (err, row) {
            if (err) {
                return reject(err.message);
            }
            console.log("data latest row", row)
            return resolve(row || null);
        });
    });
}

function viewAll() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM data;`, [], function (err, rows) {
            if (err) {
                return reject(err.message);
            }
            // console.log("test", rows);
            return resolve(rows); // rows là mảng chứa tất cả các dòng
        });
    });
}



module.exports = {
    write,
    updateGoldPrices,
    view_latest_price,
    viewAll
}