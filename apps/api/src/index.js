// Main API Entry Point
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const path = require('path');
const express = require('express');

const config = require('shared/config');
const db = require('shared/database');
const logger = require('shared/utils/logger');
const routes = require('./routes');
const {
  securityHeaders,
  cors,
  rateLimiter,
  sanitizeInput,
} = require('./middleware/security');
const {
  errorHandler,
  notFoundHandler,
  requestId,
} = require('./middleware/errorHandler');

// Create Express app
const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Request ID middleware
app.use(requestId);

// Security middleware
app.use(securityHeaders);
app.use(cors);
app.use(sanitizeInput);

// Rate limiting
app.use(rateLimiter({ windowMs: 60000, maxRequests: 100 }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Morgan HTTP logging
const morgan = require('morgan');
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// Mount API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'AltCredit Intelligence Platform',
      version: '1.0.0',
      description: 'Production-grade Alternative Credit Intelligence MCP Server for fintech companies',
      documentation: '/api',
      healthCheck: '/api/health',
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Initialize database schema
    logger.info('Initializing database connection...');
    await db.initializeSchema();
    logger.info('Database initialized successfully');

    // Start listening
    const port = config.server.port;
    app.listen(port, () => {
      logger.info(`AltCredit Intelligence API server started`, {
        port,
        environment: config.server.env,
        nodeVersion: process.version,
      });
      logger.info(`API available at http://localhost:${port}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await db.closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await db.closePool();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason: reason?.message || reason });
});

// Start the server
startServer();

module.exports = app;
