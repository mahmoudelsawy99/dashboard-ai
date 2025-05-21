import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SalesRecord {
  day: string;
  product: string;
  price: number;
  sold: number;
}

export interface ProductPrediction {
  product: string;
  predictions: {
    [key: string]: number; // day -> predicted quantity
  };
  confidence: number;
}

@Injectable({
  providedIn: 'root'
})
export class MLPredictionService {
  private model: tf.Sequential | null = null;
  private isModelTrained = false;
  private readonly DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  private readonly DAY_TO_NUM: { [key: string]: number } = this.DAYS.reduce((acc, day, idx) => ({ ...acc, [day]: idx + 1 }), {} as { [key: string]: number });

  constructor(private http: HttpClient) {
    this.initializeModel();
  }

  private async initializeModel() {
    this.model = tf.sequential();
    this.model.add(tf.layers.dense({
      inputShape: [3], // [day_num, price, product_encoded]
      units: 16,
      activation: 'relu'
    }));
    this.model.add(tf.layers.dense({
      units: 8,
      activation: 'relu'
    }));
    this.model.add(tf.layers.dense({
      units: 1
    }));

    this.model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError',
      metrics: ['mse']
    });
  }

  private prepareTrainingData(records: SalesRecord[]): { inputs: tf.Tensor, outputs: tf.Tensor } {
    const inputs: number[][] = [];
    const outputs: number[] = [];

    records.forEach(record => {
      // Convert day to number (1-7)
      const dayNum = this.DAY_TO_NUM[record.day];
      // One-hot encode product (simplified to 0 or 1 for now)
      const productEncoded = record.product === 'iPhone' ? 1 : 0;

      inputs.push([dayNum, record.price, productEncoded]);
      outputs.push(record.sold);
    });

    return {
      inputs: tf.tensor2d(inputs),
      outputs: tf.tensor2d(outputs, [outputs.length, 1])
    };
  }

  async trainModel(historicalData: SalesRecord[]): Promise<void> {
    if (!this.model) {
      await this.initializeModel();
    }

    const { inputs, outputs } = this.prepareTrainingData(historicalData);

    await this.model!.fit(inputs, outputs, {
      epochs: 100,
      batchSize: 4,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: loss = ${logs?.['loss'].toFixed(4)}`);
        }
      }
    });

    this.isModelTrained = true;

    // Cleanup tensors
    inputs.dispose();
    outputs.dispose();
  }

  async predictNextWeek(product: string, price: number): Promise<ProductPrediction> {
    if (!this.model || !this.isModelTrained) {
      throw new Error('Model not trained yet');
    }

    const predictions: { [key: string]: number } = {};
    const productEncoded = product === 'iPhone' ? 1 : 0;
    let totalConfidence = 0;

    // Predict for each day of next week
    for (const day of this.DAYS) {
      const dayNum = this.DAY_TO_NUM[day];
      const input = tf.tensor2d([[dayNum, price, productEncoded]]);

      const prediction = this.model.predict(input) as tf.Tensor;
      const value = await prediction.data();
      predictions[day] = Math.round(value[0]);

      // Simple confidence calculation based on prediction variance
      const confidence = Math.max(0, Math.min(1, 1 - Math.abs(value[0] - 15) / 30));
      totalConfidence += confidence;

      // Cleanup tensors
      input.dispose();
      prediction.dispose();
    }

    return {
      product,
      predictions,
      confidence: totalConfidence / this.DAYS.length
    };
  }

  // Helper method to get historical data from API
  getHistoricalData(): Observable<SalesRecord[]> {
    return this.http.get<SalesRecord[]>('http://localhost:3000/api/sales/history');
  }
}
