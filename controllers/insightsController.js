const insightsService = require('../services/insightsService');

function getStoreInsights(req, res) {
  const insights = insightsService.generateInsights();
  res.json({ insights });
}

module.exports = { getStoreInsights }; 