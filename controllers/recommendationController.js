const recommendationService = require('../services/recommendationService');

function recommendSimilarProducts(req, res) {
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }
  const recommendations = recommendationService.recommendSimilarProducts(productId);
  res.json({ recommendations });
}


module.exports = { recommendSimilarProducts }; 