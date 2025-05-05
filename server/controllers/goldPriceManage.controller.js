const { viewLatestGoldPrice, viewByDate, viewAll } = require('../data/goldService.js');
const { addGoldPrice, removeGoldType } = require('../business/goldBusiness.js');

const goldPriceManageController = {
  getLatestGoldPrice: async (req, res) => {
    try {
      const data = await viewLatestGoldPrice();
      res.status(200).json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  addGoldPrice: async (req, res) => {
    try {
      const { gold_type, sell_price, buy_price, updated_at } = req.body;
      if (!gold_type || !sell_price || !buy_price || !updated_at) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }
      await addGoldPrice({ gold_type, sell_price, buy_price, updated_at });
      res.status(201).json({ success: true, message: 'Gold price added successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  deleteGoldType: async (req, res) => {
    try {
      const { gold_type } = req.body;
      if (!gold_type) {
        return res.status(400).json({ success: false, message: 'Missing gold_type' });
      }
      const deletedCount = await removeGoldType(gold_type);
      if (deletedCount === 0) {
        return res.status(404).json({ success: false, message: `No records found for ${gold_type}` });
      }
      res.status(200).json({ success: true, message: `Deleted ${deletedCount} records for ${gold_type}` });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getPriceWithDate: async (req, res) => {
    try {
      const date = req.params.date;
      const data = await viewByDate(date);
      res.status(200).json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getAllPrices: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const data = await viewAll(page, limit);
      res.status(200).json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = goldPriceManageController;