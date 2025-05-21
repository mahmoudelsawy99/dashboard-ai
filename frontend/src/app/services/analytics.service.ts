import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import * as tf from '@tensorflow/tfjs';

export interface SalesDataPoint {
  date: string;
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
  category: string;
}

export interface AnomalyDetection {
  productId: string;
  productName: string;
  date: string;
  actualValue: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  type: 'sales' | 'inventory';
}

export interface TrendAnalysis {
  productId: string;
  productName: string;
  trend: 'up' | 'down' | 'stable';
  growthRate: number;
  seasonality: number;
  confidence: number;
  lastWeekAverage: number;
  lastMonthAverage: number;
}

export interface ProductRecommendation {
  productId: string;
  productName: string;
  category: string;
  price: number;
  score: number;
  reason: string;
  similarProducts: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = 'http://localhost:3000/api';
  private anomalyModel: tf.Sequential | null = null;
  private trendModel: tf.Sequential | null = null;

  constructor(private http: HttpClient) {
    this.initializeModels();
  }

  private async initializeModels() {
    // Initialize Anomaly Detection Model
    this.anomalyModel = tf.sequential();
    this.anomalyModel.add(tf.layers.dense({
      inputShape: [5], // [dayOfWeek, month, price, category, historicalAvg]
      units: 16,
      activation: 'relu'
    }));
    this.anomalyModel.add(tf.layers.dense({
      units: 8,
      activation: 'relu'
    }));
    this.anomalyModel.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid'
    }));

    this.anomalyModel.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    // Initialize Trend Analysis Model
    this.trendModel = tf.sequential();
    this.trendModel.add(tf.layers.lstm({
      inputShape: [7, 4], // [sequence_length, features]
      units: 32,
      returnSequences: false
    }));
    this.trendModel.add(tf.layers.dense({
      units: 16,
      activation: 'relu'
    }));
    this.trendModel.add(tf.layers.dense({
      units: 3, // [trend, seasonality, confidence]
      activation: 'softmax'
    }));

    this.trendModel.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
  }

  // Anomaly Detection
  async detectAnomalies(salesData: SalesDataPoint[]): Promise<AnomalyDetection[]> {
    if (!this.anomalyModel) {
      await this.initializeModels();
    }

    const anomalies: AnomalyDetection[] = [];
    const processedData = this.preprocessSalesData(salesData);

    for (const data of processedData) {
      const input = tf.tensor2d([[
        this.getDayOfWeek(data.date),
        this.getMonth(data.date),
        data.price,
        this.encodeCategory(data.category),
        data.historicalAverage
      ]]);

      const prediction = this.anomalyModel!.predict(input) as tf.Tensor;
      const anomalyScore = await prediction.data();

      if (anomalyScore[0] > 0.8) { // Threshold for anomaly detection
        const deviation = Math.abs(data.quantity - data.historicalAverage);
        const severity = this.calculateSeverity(deviation, data.historicalAverage);

        anomalies.push({
          productId: data.productId,
          productName: data.productName,
          date: data.date,
          actualValue: data.quantity,
          expectedValue: Math.round(data.historicalAverage),
          deviation: Math.round(deviation),
          severity,
          type: 'sales'
        });
      }

      input.dispose();
      prediction.dispose();
    }

    return anomalies;
  }

  // Trend Analysis
  async analyzeTrends(salesData: SalesDataPoint[]): Promise<TrendAnalysis[]> {
    if (!this.trendModel) {
      await this.initializeModels();
    }

    const trends: TrendAnalysis[] = [];
    const groupedData = this.groupSalesByProduct(salesData);

    for (const [productId, data] of Object.entries(groupedData)) {
      const sequences = this.createSequences(data);
      if (sequences.length === 0) continue; // Skip if no sequences available

      // Create tensor with explicit shape [numSequences, sequenceLength, features]
      const input = tf.tensor3d(sequences, [sequences.length, 7, 4]);

      const prediction = this.trendModel!.predict(input) as tf.Tensor;
      const [trend, seasonality, confidence] = await prediction.data();

      const lastWeekAvg = this.calculateAverage(data.slice(-7));
      const lastMonthAvg = this.calculateAverage(data.slice(-30));

      trends.push({
        productId,
        productName: data[0].productName,
        trend: this.determineTrend(trend),
        growthRate: this.calculateGrowthRate(data),
        seasonality: seasonality,
        confidence: confidence,
        lastWeekAverage: lastWeekAvg,
        lastMonthAverage: lastMonthAvg
      });

      input.dispose();
      prediction.dispose();
    }

    return trends;
  }

  // Product Recommendations
  async getRecommendations(
    customerId: string,
    browsingHistory: string[],
    purchaseHistory: string[]
  ): Promise<ProductRecommendation[]> {
    const response = await this.http.post<ProductRecommendation[]>(`${this.apiUrl}/recommendations`, {
      customerId,
      browsingHistory,
      purchaseHistory
    }).toPromise();
    return response || [];
  }

  // Helper Methods
  private preprocessSalesData(data: SalesDataPoint[]) {
    // Calculate historical averages and prepare data for anomaly detection
    const processed = data.map(point => ({
      ...point,
      historicalAverage: this.calculateHistoricalAverage(data, point),
      price: this.getAveragePrice(data, point.productId)
    }));
    return processed;
  }

  private calculateHistoricalAverage(data: SalesDataPoint[], point: SalesDataPoint): number {
    const similarDays = data.filter(d =>
      d.productId === point.productId &&
      this.getDayOfWeek(d.date) === this.getDayOfWeek(point.date)
    );
    return similarDays.reduce((sum, d) => sum + d.quantity, 0) / similarDays.length;
  }

  private getAveragePrice(data: SalesDataPoint[], productId: string): number {
    const productData = data.filter(d => d.productId === productId);
    return productData.reduce((sum, d) => sum + d.revenue / d.quantity, 0) / productData.length;
  }

  private calculateSeverity(deviation: number, average: number): 'low' | 'medium' | 'high' {
    const percentageDeviation = (deviation / average) * 100;
    if (percentageDeviation > 50) return 'high';
    if (percentageDeviation > 25) return 'medium';
    return 'low';
  }

  private getDayOfWeek(date: string): number {
    return new Date(date).getDay();
  }

  private getMonth(date: string): number {
    return new Date(date).getMonth();
  }

  private encodeCategory(category: string): number {
    // Simple category encoding - can be enhanced
    return category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 10;
  }

  private groupSalesByProduct(data: SalesDataPoint[]): { [key: string]: SalesDataPoint[] } {
    return data.reduce((acc, point) => {
      if (!acc[point.productId]) {
        acc[point.productId] = [];
      }
      acc[point.productId].push(point);
      return acc;
    }, {} as { [key: string]: SalesDataPoint[] });
  }

  private createSequences(data: SalesDataPoint[]): number[][][] {
    const sequences: number[][][] = [];
    for (let i = 0; i < data.length - 7; i++) {
      const sequence = data.slice(i, i + 7).map(point => [
        point.quantity,
        point.revenue / point.quantity, // price
        this.getDayOfWeek(point.date),
        this.getMonth(point.date)
      ]);
      sequences.push(sequence);
    }
    return sequences;
  }

  private calculateAverage(data: SalesDataPoint[]): number {
    return data.reduce((sum, point) => sum + point.quantity, 0) / data.length;
  }

  private calculateGrowthRate(data: SalesDataPoint[]): number {
    if (data.length < 2) return 0;
    const first = data[0].quantity;
    const last = data[data.length - 1].quantity;
    return ((last - first) / first) * 100;
  }

  private determineTrend(trendScore: number): 'up' | 'down' | 'stable' {
    if (trendScore > 0.6) return 'up';
    if (trendScore < 0.4) return 'down';
    return 'stable';
  }

  // API Methods
  // getSalesData(startDate: string, endDate: string): Observable<SalesDataPoint[]> {
  //   return this.http.get<SalesDataPoint[]>(`${this.apiUrl}/sales`, {
  //     params: { startDate, endDate }
  //   });
  // }

  getInventoryData(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/inventory`);
  }

  getCustomerBehavior(customerId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/customers/${customerId}/behavior`);
  }
}
