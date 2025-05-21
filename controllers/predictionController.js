const predictionService = require('../services/predictionService');

function predictSales(req, res) {
  const { historicalData } = req.body;
  if (!historicalData) {
    return res.status(400).json({ error: 'Historical data is required' });
  }
  const prediction = predictionService.predictSales(historicalData);
  res.json({ prediction });
}

module.exports = { predictSales }; 