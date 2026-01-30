import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

// Routes
import authRoutes from './routes/authRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import buyerRoutes from './routes/buyerRoutes.js';
import workerRoutes from './routes/workerRoutes.js';

const app = express();

app.use(morgan('dev'));

/**
 * Middleware
 */

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

/**
 * Health check route
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Circular Economy Marketplace API',
    status: 'active',
    timestamp: new Date().toISOString(),
  });
});

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/workers', workerRoutes);

/**
 * Error handler
 */
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
