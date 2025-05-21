function cosineSimilarity(product1, product2) {
  // Features to compare: price, rating, sales
  const features1 = [
    normalize(product1.price, 0, 1000),
    normalize(product1.rating, 0, 5),
    normalize(product1.sales, 0, 1000)
  ];
  
  const features2 = [
    normalize(product2.price, 0, 1000),
    normalize(product2.rating, 0, 5),
    normalize(product2.sales, 0, 1000)
  ];

  const dotProduct = features1.reduce((sum, val, i) => sum + val * features2[i], 0);
  const magnitude1 = Math.sqrt(features1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(features2.reduce((sum, val) => sum + val * val, 0));

  return dotProduct / (magnitude1 * magnitude2);
}

function normalize(value, min, max) {
  return (value - min) / (max - min);
}

module.exports = cosineSimilarity; 