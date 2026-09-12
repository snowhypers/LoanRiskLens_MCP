// Database connection pool and utilities

const { Pool } = require('pg');
const config = require('../config');
const logger = require('../utils/logger');

let pool = null;

// Create database pool
function createPool() {
  if (pool) return pool;

  const poolConfig = {
    max: config.database.max,
    idleTimeoutMillis: config.database.idleTimeoutMillis,
    connectionTimeoutMillis: config.database.connectionTimeoutMillis,
  };

  // Use connection string for Supabase/browser, otherwise individual params
  if (config.database.connectionString) {
    poolConfig.connectionString = config.database.connectionString;
    // SSL is handled in connection string via sslmode=require
  } else {
    poolConfig.host = config.database.host;
    poolConfig.port = config.database.port;
    poolConfig.database = config.database.name;
    poolConfig.user = config.database.user;
    poolConfig.password = config.database.password;
    // Use SSL only when explicitly enabled for local connections
    if (config.database.ssl) {
      poolConfig.ssl = { rejectUnauthorized: false };
    }
  }

  pool = new Pool(poolConfig);

  pool.on('error', (err) => {
    logger.error('Unexpected database pool error', { error: err.message });
  });

  pool.on('connect', () => {
    logger.debug('New database connection established');
  });

  return pool;
}

// Get database pool
function getPool() {
  if (!pool) {
    return createPool();
  }
  return pool;
}

// Execute a parameterized query
async function query(text, params) {
  const pool = getPool();
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Query executed', { query: text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Query error', { query: text, error: error.message });
    throw error;
  }
}

// Execute query within a transaction
async function transaction(callback) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Initialize database schema
async function initializeSchema() {
  const schema = `
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) UNIQUE NOT NULL,
      occupation VARCHAR(100),
      employer_name VARCHAR(255),
      monthly_income DECIMAL(12, 2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Safe schema upgrades for databases created by older versions.
    -- CREATE TABLE IF NOT EXISTS does not add missing columns.
    ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation VARCHAR(100);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS employer_name VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(12, 2);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

    -- Transactions table
    CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      amount DECIMAL(12, 2) NOT NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN ('CREDIT', 'DEBIT')),
      status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING')),
      category VARCHAR(50) NOT NULL,
      description TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

    -- Savings history table
    CREATE TABLE IF NOT EXISTS savings_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      deposit_amount DECIMAL(12, 2) DEFAULT 0,
      withdrawal_amount DECIMAL(12, 2) DEFAULT 0,
      balance DECIMAL(12, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE savings_history ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(12, 2) DEFAULT 0;
    ALTER TABLE savings_history ADD COLUMN IF NOT EXISTS withdrawal_amount DECIMAL(12, 2) DEFAULT 0;
    ALTER TABLE savings_history ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) DEFAULT 0;
    ALTER TABLE savings_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

    -- Underwriting reports table
    CREATE TABLE IF NOT EXISTS underwriting_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      credit_score INTEGER NOT NULL,
      risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
      recommended_amount DECIMAL(12, 2),
      recommendation VARCHAR(20) NOT NULL CHECK (recommendation IN ('APPROVED', 'REVIEW', 'REJECTED')),
      explanation TEXT,
      details JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE underwriting_reports ADD COLUMN IF NOT EXISTS recommended_amount DECIMAL(12, 2);
    ALTER TABLE underwriting_reports ADD COLUMN IF NOT EXISTS explanation TEXT;
    ALTER TABLE underwriting_reports ADD COLUMN IF NOT EXISTS details JSONB;
    ALTER TABLE underwriting_reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE underwriting_reports ALTER COLUMN id SET DEFAULT gen_random_uuid();

    -- Audit logs table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      action VARCHAR(100) NOT NULL,
      resource VARCHAR(100),
      details JSONB,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id UUID;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource VARCHAR(100);
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
    CREATE INDEX IF NOT EXISTS idx_transactions_user_timestamp ON transactions(user_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_savings_user_id ON savings_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_savings_created_at ON savings_history(created_at);
    CREATE INDEX IF NOT EXISTS idx_underwriting_user_id ON underwriting_reports(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
  `;

  try {
    await query(schema);
    logger.info('Database schema initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database schema', { error: error.message });
    throw error;
  }
}

// Close database pool
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
}

module.exports = {
  getPool,
  query,
  transaction,
  initializeSchema,
  closePool,
};
