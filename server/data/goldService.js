const { Data, sequelize } = require('../db/dbConnect.js');
const { Op } = require('sequelize');
const { publisher } = require('../services/redis.js');

async function saveGoldPrice({ gold_type, sell_price, buy_price, updated_at }, transaction) {
  try {
    if (!gold_type || typeof sell_price !== 'number' || typeof buy_price !== 'number' || !updated_at) {
      throw new Error('Invalid data');
    }

    const result = await Data.upsert({
      gold_type,
      sell_price,
      buy_price,
      updated_at: new Date(updated_at)
    }, { transaction });

    const cacheKey = 'latest_gold_prices';
    await publisher.del(cacheKey);

    return result;
  } catch (err) {
    throw new Error(`Error saving gold price: ${err.message}`);
  }
}

async function viewLatestGoldPrice() {
  try {
    const cacheKey = 'latest_gold_prices';
    const cached = await publisher.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

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

    await publisher.setEx(cacheKey, 300, JSON.stringify(records));
    return records;
  } catch (err) {
    throw new Error(`Error fetching latest prices: ${err.message}`);
  }
}

async function viewByDate(date) {
  try {
    const startVN = new Date(date);
    startVN.setUTCHours(-7, 0, 0, 0);
    const endVN = new Date(date);
    endVN.setUTCHours(16, 59, 59, 999);

    const cacheKey = `gold_prices_${date}`;
    const cached = await publisher.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const records = await Data.findAll({
      attributes: ['gold_type', 'sell_price', 'buy_price', 'updated_at'],
      where: {
        updated_at: {
          [Op.between]: [startVN, endVN]
        }
      },
      order: [['updated_at', 'DESC']],
      raw: true
    });

    const uniqueRecords = [];
    const seenTypes = new Set();
    for (const record of records) {
      if (!seenTypes.has(record.gold_type)) {
        seenTypes.add(record.gold_type);
        uniqueRecords.push(record);
      }
    }

    await publisher.setEx(cacheKey, 3600, JSON.stringify(uniqueRecords));
    return uniqueRecords;
  } catch (err) {
    throw new Error(`Error fetching prices by date: ${err.message}`);
  }
}

async function updateGoldPrices(dataArray) {
  const transaction = await sequelize.transaction();
  try {
    const promises = dataArray.map(item => {
      if (!item.gold_type || typeof item.sell_price !== 'number' || typeof item.buy_price !== 'number' || !item.updated_at) {
        throw new Error('Invalid data');
      }
      return Data.upsert({
        gold_type: item.gold_type,
        sell_price: item.sell_price,
        buy_price: item.buy_price,
        updated_at: new Date(item.updated_at)
      }, { transaction });
    });

    await Promise.all(promises);
    await transaction.commit();

    const cacheKey = 'latest_gold_prices';
    await publisher.del(cacheKey);

    return `Updated ${dataArray.length} records`;
  } catch (err) {
    await transaction.rollback();
    throw new Error(`Error updating prices: ${err.message}`);
  }
}

async function deleteByGoldType(gold_type, transaction) {
  try {
    if (!gold_type) {
      throw new Error('Invalid gold_type');
    }
    const deletedCount = await Data.destroy({
      where: { gold_type },
      transaction
    });

    const cacheKey = 'latest_gold_prices';
    await publisher.del(cacheKey);

    return deletedCount;
  } catch (err) {
    throw new Error(`Error deleting gold type: ${err.message}`);
  }
}

async function viewAll(page = 1, limit = 10) {
  try {
    const offset = (page - 1) * limit;
    const { rows, count } = await Data.findAndCountAll({
      order: [['updated_at', 'DESC']],
      limit,
      offset,
      raw: true
    });
    return { rows, total: count, page, limit };
  } catch (err) {
    throw new Error(`Error fetching all records: ${err.message}`);
  }
}

module.exports = {
  saveGoldPrice,
  viewLatestGoldPrice,
  viewByDate,
  updateGoldPrices,
  deleteByGoldType,
  viewAll
};