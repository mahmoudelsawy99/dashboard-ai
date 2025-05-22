# AI E-commerce Assistant

An AI-powered assistant for e-commerce stores built with Node.js and Express.

## Features

- **Sales Prediction**: Predict future sales using simple linear regression.
- **Product Recommendation**: Recommend similar products based on price, rating, and sales using cosine similarity.
- **Store Insights**: Generate smart suggestions for store owners, including top-selling products, low-performance products, best-performing categories, and more.

## Project Structure

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
