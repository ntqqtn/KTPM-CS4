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
        if (!gold_type || typeof sell_price !== 'number' || typeof buy_price !== 'number' || !updated_at) {
            return reject('Dữ liệu không hợp lệ');
        }

        db.run(
            `
            INSERT INTO data (gold_type, sell_price, buy_price, updated_at) 
            VALUES (?, ?, ?, ?)
            `,
            [gold_type, sell_price, buy_price, updated_at],
            function (err) {
                if (err) {
                    return reject(err.message);
                }
                return resolve(this.lastID);
            }
        );
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
            if (!item.gold_type || typeof item.sell_price !== 'number' || typeof item.buy_price !== 'number' || !item.updated_at) {
                return reject("Dữ liệu không hợp lệ.");
            }
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
            ON CONFLICT(gold_type, updated_at) DO UPDATE SET
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
        db.all(`
            SELECT gold_type, sell_price, buy_price, updated_at
            FROM data
            WHERE (gold_type, updated_at) IN (
                SELECT gold_type, MAX(updated_at)
                FROM data
                GROUP BY gold_type
            )
            ORDER BY gold_type ASC
        `, [], function (err, rows) {
            if (err) {
                return reject(err.message);
            }
            return resolve(rows || []);
        });
    });
}

function view_by_date(date) {
    return new Promise((resolve, reject) => {
        const formattedDate = new Date(date).toISOString().split('T')[0];
        db.all(`
            SELECT gold_type, sell_price, buy_price, updated_at
            FROM data
            WHERE (gold_type, updated_at) IN (
                SELECT gold_type, MAX(updated_at)
                FROM data
                WHERE DATE(updated_at) = ?
                GROUP BY gold_type
            )
            ORDER BY gold_type ASC
        `, [formattedDate], function (err, rows) {
            if (err) {
                return reject(err.message);
            }
            return resolve(rows || []);
        });
    });
}

function view_yesterday_price() {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT gold_type, sell_price, buy_price, updated_at
            FROM data
            WHERE (gold_type, updated_at) IN (
                SELECT gold_type, MAX(updated_at)
                FROM data
                WHERE DATE(updated_at) = DATE('now', '-1 day')
                GROUP BY gold_type
            )
            ORDER BY gold_type ASC
        `, [], function (err, rows) {
            if (err) {
                return reject(err.message);
            }
            return resolve(rows || []);
        });
    });
}

function viewAll() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM data ORDER BY updated_at DESC;`, [], function (err, rows) {
            if (err) {
                return reject(err.message);
            }
            return resolve(rows);
        });
    });
}

function get_all_gold_types() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT DISTINCT gold_type FROM data`, [], function (err, rows) {
            if (err) {
                return reject(err.message);
            }
            return resolve(rows.map(row => row.gold_type));
        });
    });
}

module.exports = {
    write,
    updateGoldPrices,
    view_latest_price,
    view_by_date,
    view_yesterday_price,
    viewAll,
    get_all_gold_types
};