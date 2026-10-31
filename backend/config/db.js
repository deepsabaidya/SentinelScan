const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas
 * Follows cloud database requirements strictly:
 * - Credentials & connection strings read securely from environment variables
 * - No hardcoded secrets or localhost fallback
 * - Clear diagnostics if MONGODB_URI is absent
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('\x1b[31m%s\x1b[0m', '=============================================================');
    console.error('\x1b[31m%s\x1b[0m', 'FATAL ERROR: MONGODB_URI environment variable is not defined.');
    console.error('\x1b[33m%s\x1b[0m', 'Please configure your MongoDB Atlas connection string in .env:');
    console.error('\x1b[36m%s\x1b[0m', 'MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/sentinelscan?retryWrites=true&w=majority');
    console.error('\x1b[31m%s\x1b[0m', '=============================================================');
    throw new Error('MONGODB_URI is required. Please provide a valid MongoDB Atlas connection string.');
  }

  // Safety check: ensure no localhost URI is mistakenly used
  if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
    console.warn('\x1b[33m%s\x1b[0m', '[SECURITY WARNING] A local MongoDB URI was detected.');
    console.warn('\x1b[33m%s\x1b[0m', 'SentinelScan is configured for cloud deployment on MongoDB Atlas.');
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s if Atlas is unreachable
      autoIndex: true, // Build indexes automatically in development
    });

    console.log('\x1b[32m%s\x1b[0m', `[MongoDB Atlas] Connected successfully to host: ${conn.connection.host}`);
    console.log(`[MongoDB Atlas] Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `[MongoDB Atlas] Connection failed: ${error.message}`);
    console.error('\x1b[33m%s\x1b[0m', 'Tip: Verify your MongoDB Atlas IP Access List allows connections (e.g. 0.0.0.0/0 for all IPs) and that your database username & password are correct.');
    throw error;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB Atlas] Disconnected from cluster.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB Atlas] Reconnected to cluster.');
});

module.exports = connectDB;
