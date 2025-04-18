const db = require('../db/dbConnect');
const { publishGoldPrice } = require('../services/pubsub/publisher');

async function saveGoldPrice({ gold_type, sell_price, buy_price, updated_at }) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO data (gold_type, sell_price, buy_price, updated_at) VALUES (?, ?, ?, ?)`,
      [gold_type, sell_price, buy_price, updated_at],
      async function (err) {
        if (err) return reject(err);
        await publishGoldPrice({ gold_type, sell_price, buy_price, updated_at });
        resolve();
      }
    );
  });
}

async function viewLatestGoldPrice() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT d1.*
        FROM data d1
        INNER JOIN (
            SELECT gold_type, MAX(updated_at) AS max_updated
            FROM data
            GROUP BY gold_type
        ) d2 ON d1.gold_type = d2.gold_type AND d1.updated_at = d2.max_updated;
`, [], function (err, row) {
          if (err) return reject(err.message);
          console.log("data latest row in utils/goldService.js", row);
          return resolve(row || null);
        }
      );
    });
  }

module.exports = { saveGoldPrice, viewLatestGoldPrice };