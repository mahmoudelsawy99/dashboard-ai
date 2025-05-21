const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

router.post('/similar', recommendationController.recommendSimilarProducts);

module.exports = router; 