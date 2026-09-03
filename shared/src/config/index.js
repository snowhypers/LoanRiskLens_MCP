// Configuration module for the AltCredit Intelligence Platform
require('dotenv').config();

const config = {
  // Database configuration
  database: {
    // Use DATABASE_URL for Supabase (single source of truth).
    // If DATABASE_URL is missing, fall back to local params.
    connectionString: process.env.DATABASE_URL || undefined,

    host: process.env.DATABASE_URL ? undefined : (process.env.DB_HOST || 'localhost'),
    port: process.env.DATABASE_URL ? undefined : parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DATABASE_URL ? undefined : (process.env.DB_NAME || 'altcredit_db'),
    user: process.env.DATABASE_URL ? undefined : (process.env.DB_USER || 'postgres'),
    password: process.env.DATABASE_URL ? undefined : (process.env.DB_PASSWORD || 'postgres'),

    max: parseInt(process.env.DB_POOL_MAX || '20'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),

    ssl: process.env.DATABASE_URL
      ? { rejectUnauthorized: false }
      : (process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false),
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'altcredit-super-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '3000'),
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*',
  },

  // MCP Server configuration
  mcp: {
    port: parseInt(process.env.MCP_PORT || '3001'),
    name: 'AltCredit Intelligence MCP Server',
    version: '1.0.0',
    secret: process.env.MCP_SECRET,
  },

  // Credit scoring weights
  scoring: {
    weights: {
      transactionConsistency: 0.35,
      savingsDiscipline: 0.40,
      cashflowStability: 0.25,
    },
    riskThresholds: {
      low: 70,
      medium: 40,
      high: 0,
    },
  },

  // Loan configuration
  loan: {
    minAmount: 1000,
    maxAmount: 500000,
    defaultAmount: 10000,
  },

  // Audit logging
  audit: {
    enabled: true,
    retentionDays: 90,
  },
};

module.exports = config;
