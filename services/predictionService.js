const tf = require('@tensorflow/tfjs');

async function predictSales(historicalData) {
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

    // Prepare data for TensorFlow.js
    const xs = tf.tensor2d(historicalData.map(p => [p.x]));
    const ys = tf.tensor2d(historicalData.map(p => [p.y]));

    // Build a simple regression model
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [1], units: 8, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1 }));
    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

    // Train the model
    await model.fit(xs, ys, { epochs: 100, verbose: 0 });

    // Predict next value
    const nextTime = historicalData.length + 1;
    const predictionTensor = model.predict(tf.tensor2d([[nextTime]]));
    const predictionArr = await predictionTensor.data();
    const prediction = Math.max(0, Math.round(predictionArr[0]));

    // Calculate confidence (R^2)
    const yTrue = historicalData.map(p => p.y);
    const yPredTensor = model.predict(xs);
    const yPredArr = Array.from(await yPredTensor.data());
    const meanY = yTrue.reduce((a, b) => a + b, 0) / yTrue.length;
    const totalSS = yTrue.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
    const residualSS = yTrue.reduce((sum, y, i) => sum + Math.pow(y - yPredArr[i], 2), 0);
    const rSquared = 1 - (residualSS / totalSS);
    const confidence = Math.max(0, Math.min(1, rSquared));

    // Calculate trend
    const trend = yPredArr[yPredArr.length - 1] - yPredArr[0] > 0 ? 'increasing' : 'decreasing';

    // Cleanup
    xs.dispose();
    ys.dispose();
    predictionTensor.dispose();
    yPredTensor.dispose();
    model.dispose();

    return {
      prediction,
      confidence,
      trend
    };
  } catch (error) {
    console.error('Error predicting sales:', error);
    return { error: error.message || 'Failed to predict sales' };
  }
}

module.exports = { predictSales }; 