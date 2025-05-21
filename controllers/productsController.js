const fs = require('fs');
const path = require('path');

function getProducts(req, res) {
  const filePath = path.join(__dirname, '../data/products.json');
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const products = JSON.parse(data).products;
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read products data.' });
  }
}

module.exports = { getProducts }; 