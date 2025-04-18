const express = require('express');
var router = express.Router();
const goldPriceManageRouter = require("./gold-price-manage.js");

router.use(goldPriceManageRouter);

module.exports = router;
