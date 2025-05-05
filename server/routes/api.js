const express = require('express');
const router = express.Router();
const goldPriceManageRouter = require('./gold-price-manage');

router.use(goldPriceManageRouter);

module.exports = router;