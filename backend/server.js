const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Attempt loading .env from root or local directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const websiteRoutes = require('./routes/websiteRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Security Middleware: Helmet (Hardens HTTP response headers)
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows cross-origin API calls & PDF blobs in frontend
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Cross-Origin Resource Sharing (CORS) Configuration
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server) or matching frontend
      if (!origin || origin === allowedOrigin || origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173') {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev/academic demo mode
      }
    },
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply General Rate Limiter to all API endpoints
app.use('/api', apiLimiter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'healthy',
    product: 'SentinelScan Security Platform',
    version: '1.0.0',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 Route Catch-all
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' does not exist on SentinelScan backend.`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start Server unless imported as a test module
if (process.env.NODE_ENV !== 'test') {
  // Connect to MongoDB Atlas first
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log('\x1b[36m%s\x1b[0m', '=============================================================');
        console.log('\x1b[32m%s\x1b[0m', `  SENTINELSCAN SECURITY API SERVER RUNNING ON PORT: ${PORT}`);
        console.log('\x1b[36m%s\x1b[0m', `  Health Check: http://localhost:${PORT}/api/health`);
        console.log('\x1b[36m%s\x1b[0m', '=============================================================');
      });
    })
    .catch((err) => {
      console.error('\x1b[31m%s\x1b[0m', `[Server Init Failed] Could not establish MongoDB Atlas connection: ${err.message}`);
      // Still listen so health and diagnostics can be reached even if DB config is pending
      app.listen(PORT, () => {
        console.warn(`[SentinelScan Server] Running in degraded mode on port ${PORT}. Configure MONGODB_URI in .env to enable database operations.`);
      });
    });
}

module.exports = app;
