const express = require('express');
const goldPriceController = require('../controllers/goldPriceManage.controller.js');

var router = express.Router();

// API get latest price for users
router.get('/latest-gold-price', goldPriceController.getLatestGoldPrice);

//API get price with date
router.get('/price-with-date/:date', goldPriceController.getPriceWithDate);

// API admin post gold data - add a new gold type
router.post('/admin-add', goldPriceController.addGoldPrice);

// API admin update gold data - add (change) latest change of a gold type
router.delete('/admin-delete', goldPriceController.deleteGoldType);
// API delete gold data 


module.exports = router;
