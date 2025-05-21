import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  sales: number;
  reviews: number;
  brand: string;
  createdAt: string;
}

export interface SalesPrediction {
  prediction: number;
  confidence: number;
  trend: 'increasing' | 'decreasing';
}

export interface Insights {
  totalProducts: number;
  topSelling: Product[];
  lowStock: Product[];
  bestCategories: { category: string; sales: number }[];
  priceRange: { min: number; max: number; avg: number };
  averageRating: number;
  salesTrend: {
    totalSales: number;
    averageSales: number;
    trend: string;
    monthly?: number[];
  };
  notSold?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class InsightsService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getInsights(): Observable<Insights> {
    console.log('Calling getInsights()');
    return this.http.get<{ insights: Insights }>(`${this.apiUrl}/insights/store`)
      .pipe(
        map(response => {
          console.log('getInsights() response:', response);
          return response.insights;
        })
      );
  }

  getProducts(): Observable<Product[]> {
    console.log('Calling getProducts()');
    return this.http.get<{ products: Product[] }>(`${this.apiUrl}/products`)
      .pipe(
        map(response => {
          console.log('getProducts() response:', response);
          return response.products;
        })
      );
  }

  getSalesPrediction(historicalData: Array<{ x: number, y: number }>): Observable<SalesPrediction> {
    return this.http.post<{ prediction: SalesPrediction }>(`${this.apiUrl}/prediction/sales`, { historicalData })
      .pipe(
        map(response => {
          console.log('getSalesPrediction() response:', response);
          return response.prediction;
        })
      );
  }

  calculateMonthOverMonth(products: Product[]): {
    currentMonth: number;
    lastMonth: number;
    percentageChange: number;
  } {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const currentMonthSales = products
      .filter(p => new Date(p.createdAt) >= lastMonth)
      .reduce((sum, p) => sum + p.sales, 0);

    const previousMonthSales = products
      .filter(p => {
        const date = new Date(p.createdAt);
        return date >= new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1, 1)
          && date < lastMonth;
      })
      .reduce((sum, p) => sum + p.sales, 0);

    const percentageChange = previousMonthSales === 0
      ? 100
      : ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100;

    return {
      currentMonth: currentMonthSales,
      lastMonth: previousMonthSales,
      percentageChange: Math.round(percentageChange * 100) / 100
    };
  }
}
