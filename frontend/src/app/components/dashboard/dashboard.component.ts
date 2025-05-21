import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { InsightsService, Insights, Product, SalesPrediction } from '../../services/insights.service';
import { MLPredictionService, ProductPrediction } from '../../services/ml-prediction.service';
import { AnalyticsService, AnomalyDetection, TrendAnalysis, ProductRecommendation } from '../../services/analytics.service';
import { SalesChartComponent } from './sales-chart/sales-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatTabsModule,
    MatBadgeModule,
    SalesChartComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  loading = true;
  error: string | null = null;
  insights: Insights | null = null;
  monthOverMonth = { currentMonth: 0, lastMonth: 0, percentageChange: 0 };
  prediction: SalesPrediction | null = null;
  productPredictions: ProductPrediction[] = [];
  mlPredictionStatus: string = '';
  averageConfidence = 0;
  displayedColumns = ['product', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  anomalies: AnomalyDetection[] = [];
  trends: TrendAnalysis[] = [];
  recommendations: ProductRecommendation[] = [];
  anomalyColumns = ['productName', 'date', 'actualValue', 'expectedValue', 'deviation'];
  trendColumns = ['productName', 'trend', 'seasonality', 'confidence'];
  topTrends: TrendAnalysis[] = [];

  constructor(
    private insightsService: InsightsService,
    private mlService: MLPredictionService,
    private analyticsService: AnalyticsService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  private async loadData() {
    try {
      // Load insights and products as before
      this.insightsService.getInsights().subscribe({
        next: async (insights) => {
          if (!insights || (insights as any).error) {
            this.error = (insights as any).error || 'No insights data available.';
          } else {
            this.insights = insights;
            console.log('INSIGHTS:', insights);

            // Load sales data for analytics
            const endDate = new Date().toISOString();
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

            // const salesData = await this.analyticsService.getSalesData(startDate, endDate).toPromise();
            // if (salesData) {
            //   // Detect anomalies
            //   this.anomalies = await this.analyticsService.detectAnomalies(salesData);

            //   // Analyze trends
            //   this.trends = await this.analyticsService.analyzeTrends(salesData);
            //   this.topTrends = this.trends
            //     .sort((a, b) => Math.abs(b.growthRate) - Math.abs(a.growthRate))
            //     .slice(0, 3);

            //   // Get recommendations for top customers
            //   const customerId = 'top-customer-1'; // In real app, get from auth service
            //   const recommendations = await this.analyticsService.getRecommendations(
            //     customerId,
            //     [], // browsing history
            //     []  // purchase history
            //   );
            //   this.recommendations = recommendations;
            // }
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load insights:', err);
          this.error = 'Failed to load insights.';
          this.loading = false;
        }
      });

      // Load products for month-over-month comparison
      this.insightsService.getProducts().subscribe({
        next: (products) => {
          this.monthOverMonth = this.insightsService.calculateMonthOverMonth(products);
        },
        error: (err) => {
          console.error('Failed to load products:', err);
        }
      });

      // After setting this.trends and this.topTrends, filter out incomplete objects
      this.trends = (this.trends || []).filter(t => t && t.productName);
      this.topTrends = (this.topTrends || []).filter(t => t && t.productName);
      // After setting this.recommendations, filter out incomplete objects
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.error = 'Failed to load dashboard data.';
      this.loading = false;
    }
  }

  getSeverityCount(severity: 'high' | 'medium' | 'low'): number {
    return this.anomalies.filter(a => a.severity === severity).length;
  }
}
