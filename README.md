# AI E-commerce Assistant

An AI-powered assistant for e-commerce stores built with Node.js and Express.

## Features

- **Sales Prediction**: Predict future sales using simple linear regression.
- **Product Recommendation**: Recommend similar products based on price, rating, and sales using cosine similarity.
- **Store Insights**: Generate smart suggestions for store owners, including top-selling products, low-performance products, best-performing categories, and more.

## Project Structure

```
ai-ecommerce-assistant/
│
├── app.js                  # Main Express app entry point
├── package.json
├── /config
│   └── db.js               # Handles reading/writing JSON database
├── /controllers
│   ├── insightsController.js
│   ├── predictionController.js
│   └── recommendationController.js
├── /routes
│   ├── insights.js
│   ├── prediction.js
│   └── recommendation.js
├── /services
│   ├── insightsService.js
│   ├── predictionService.js
│   └── recommendationService.js
├── /models
│   └── productModel.js     # Handles product data logic
├── /data
│   └── db.json             # The JSON "database"
├── /utils
│   ├── linearRegression.js
│   └── cosineSimilarity.js
├── /middleware
│   └── errorHandler.js
└── README.md
```

## Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the project:
   ```bash
   npm start
   ```
   For development with auto-reload:
   ```bash
   npm run dev
   ```

## API Endpoints

- **Sales Prediction**: `POST /api/prediction/sales`
- **Product Recommendation**: `POST /api/recommendation/similar`
- **Store Insights**: `GET /api/insights/store`

## License

MIT 