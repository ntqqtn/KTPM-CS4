const { saveGoldPrice, deleteByGoldType } = require('../data/goldService');
const { publishGoldPrice } = require('../services/pubsub/publisher.js');
const { sequelize } = require('../db/dbConnect.js');

async function addGoldPrice({ gold_type, sell_price, buy_price, updated_at }) {
  const transaction = await sequelize.transaction();
  try {
    await saveGoldPrice({ gold_type, sell_price, buy_price, updated_at }, transaction);
    await publishGoldPrice({ gold_type, sell_price, buy_price, updated_at, action: 'add' });
    await transaction.commit();
    return 'Gold price added successfully';
  } catch (err) {
    await transaction.rollback();
    throw new Error(`Business error adding gold price: ${err.message}`);
  }
}

async function removeGoldType(gold_type) {
  const transaction = await sequelize.transaction();
  try {
    const deletedCount = await deleteByGoldType(gold_type, transaction);
    await publishGoldPrice({ gold_type, action: 'delete' });
    await transaction.commit();
    return deletedCount;
  } catch (err) {
    await transaction.rollback();
    throw new Error(`Business error deleting gold type: ${err.message}`);
  }
}

module.exports = {
  addGoldPrice,
  removeGoldType
};