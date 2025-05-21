const fs = require('fs');
const path = require('path');
const cosineSimilarity = require('../utils/cosineSimilarity');

function readProducts() {
  try {
    const filePath = path.join(__dirname, '../data/products.json');
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data).products || [];
  } catch (error) {
    console.error('Error reading products:', error);
    return [];
  }
}

function recommendSimilarProducts(productId) {
  try {
    const products = readProducts();
    const targetProduct = products.find(p => p.id === productId);
    
    if (!targetProduct) {
      return { error: 'Product not found' };
    }

    const recommendations = products
      .filter(p => p.id !== productId)
      .map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        rating: p.rating,
        similarity: cosineSimilarity(targetProduct, p)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    return { recommendations };
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return { error: 'Failed to generate recommendations' };
  }
}

module.exports = { recommendSimilarProducts }; 