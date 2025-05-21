const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');

router.post('/sales', predictionController.predictSales);

module.exports = router; 