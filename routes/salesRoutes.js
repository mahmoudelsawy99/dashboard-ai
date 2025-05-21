const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const salesController = require('../controllers/salesController');

// Helper to load and save sales data
const dataFile = path.join(__dirname, '../data/sales-data.json');
const loadData = () => {
  try {
    const rawData = fs.readFileSync(dataFile);
    return JSON.parse(rawData);
  } catch (error) {
    return { salesData: [], insights: {} };
  }
};
const saveData = (data) => {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
};

// GET /api/sales?startDate=...&endDate=...
router.get('/', salesController.getSales);

// POST /api/sales (optional, to add new sales)
router.post('/', salesController.addSale);

module.exports = router; 