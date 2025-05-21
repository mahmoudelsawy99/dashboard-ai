const linearRegression = require('../utils/linearRegression');

function predictSales(historicalData) {
  try {
    if (!Array.isArray(historicalData) || historicalData.length < 2) {
      throw new Error('Historical data must be an array with at least 2 data points');
    }

    // Validate data format
    const isValid = historicalData.every(point => 
      typeof point === 'object' && 
      typeof point.x === 'number' && 
      typeof point.y === 'number'
    );

    if (!isValid) {
      throw new Error('Each data point must have numeric x and y values');
    }

    const { slope, intercept } = linearRegression(historicalData);
    const nextTime = historicalData.length + 1;
    const prediction = slope * nextTime + intercept;

    return {
      prediction: Math.max(0, Math.round(prediction)), // Ensure non-negative prediction
      confidence: calculateConfidence(historicalData, slope, intercept),
      trend: slope > 0 ? 'increasing' : 'decreasing'
    };
  } catch (error) {
    console.error('Error predicting sales:', error);
    return { error: error.message || 'Failed to predict sales' };
  }
}

function calculateConfidence(data, slope, intercept) {
  // Simple confidence calculation based on R-squared
  const meanY = data.reduce((sum, point) => sum + point.y, 0) / data.length;
  const totalSS = data.reduce((sum, point) => sum + Math.pow(point.y - meanY, 2), 0);
  const residualSS = data.reduce((sum, point) => {
    const predicted = slope * point.x + intercept;
    return sum + Math.pow(point.y - predicted, 2);
  }, 0);
  
  const rSquared = 1 - (residualSS / totalSS);
  return Math.max(0, Math.min(1, rSquared)); // Ensure between 0 and 1
}

module.exports = { predictSales }; 