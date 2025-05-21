const fs = require('fs');
const path = require('path');

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

function generateInsights() {
  try {
    const products = readProducts();
    if (!products.length) {
      return { error: 'No products found' };
    }

    return {
      totalProducts: products.length,
      topSelling: products.sort((a, b) => b.sales - a.sales).slice(0, 5),
      lowStock: products.filter(p => p.stock < 10),
      bestCategories: getBestCategories(products),
      priceRange: getPriceRange(products),
      averageRating: getAverageRating(products),
      salesTrend: getSalesTrend(products)
    };
  } catch (error) {
    console.error('Error generating insights:', error);
    return { error: 'Failed to generate insights' };
  }
}

function getBestCategories(products) {
  const categories = {};
  products.forEach(p => {
    if (!categories[p.category]) categories[p.category] = 0;
    categories[p.category] += p.sales;
  });
  return Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, sales]) => ({ category, sales }));
}

function getPriceRange(products) {
  const prices = products.map(p => p.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    avg: prices.reduce((a, b) => a + b, 0) / prices.length
  };
}

function getAverageRating(products) {
  const ratings = products.map(p => p.rating);
  return ratings.reduce((a, b) => a + b, 0) / ratings.length;
}

function getSalesTrend(products) {
  const totalSales = products.reduce((sum, p) => sum + p.sales, 0);
  const avgSales = totalSales / products.length;
  return {
    totalSales,
    averageSales: avgSales,
    trend: avgSales > 100 ? 'growing' : 'stable'
  };
}

module.exports = { generateInsights }; 