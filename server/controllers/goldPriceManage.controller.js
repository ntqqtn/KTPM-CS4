const { saveGoldPrice, viewLatestGoldPrice, view_by_date } = require('../utils/goldService.js');

const goldPriceManageController = {
    getLatestGoldPrice: async (req, res) => {
        try {
            const data = await viewLatestGoldPrice();
            res.status(200).json({ success: true, data });
          } catch (err) {
            res.status(500).json({ success: false, message: err });
        }
    },
    addGoldPrice: async (req, res) => {
        try {
            const { gold_type, sell_price, buy_price, updated_at } = req.body;
        
            if (!gold_type || !sell_price || !buy_price || !updated_at) {
              return res.status(400).json({ message: 'Missing required fields' });
            }
        
            await saveGoldPrice({ gold_type, sell_price, buy_price, updated_at });
            return res.status(201).json({ message: 'Gold price added successfully' });
          } catch (error) {
            console.error('Error adding gold price:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    },
    deleteGoldType: (req, res) => {
      
    },
    getPriceWithDate: async (req, res) => {
      try{
        const date = req.params.date;
        console.log("date", date);

        if (!view_by_date) {
          console.log("Hàm view_by_date chưa được định nghĩa hoặc import.");
          return res.status(500).json({ success: false, message: 'view_by_date not found' });
        }
        
        const data = await view_by_date(date);
        console.log("data trong view by date", data)
        res.status(200).json({ success: true, data });
      } catch (err) {
        res.status(500).json({ success: false, message: err });
      } 
    }
}

module.exports = goldPriceManageController;

