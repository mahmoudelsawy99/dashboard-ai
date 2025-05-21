const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insightsController');

router.get('/store', insightsController.getStoreInsights);

module.exports = router; 