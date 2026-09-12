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

  // Credit scoring — SINGLE SOURCE OF TRUTH for all scoring weights,
  // factor weights, bands and thresholds. Every consumer (domain scoring
  // engine, risk analysis, workflow agents, application services) reads
  // from here; do not hardcode these values elsewhere.
  scoring: {
    // Overall weighted behavior score weights (must sum to 1.0)
    // overall = (transactionScore × w) + (savingsScore × w) + (cashflowScore × w)
    weights: {
      transactionConsistency: 0.35,
      savingsDiscipline: 0.40,
      cashflowStability: 0.25,
    },

    // Factor weights inside each component score (each group sums to 1.0)
    factorWeights: {
      transactionConsistency: {
        successRate: 0.30,          // Factor 1: transaction success rate
        incomeConsistency: 0.40,    // Factor 2: income consistency
        inflowOutflowRatio: 0.30,   // Factor 3: inflow/outflow ratio stability
      },
      savingsDiscipline: {
        savingsRatio: 0.40,         // Factor 1: deposit share of total flow
        depositFrequency: 0.35,     // Factor 2: deposit frequency consistency
        withdrawalPattern: 0.25,    // Factor 3: deposit vs withdrawal pattern
      },
      cashflowStability: {
        incomeConsistency: 0.50,    // Factor 1: income consistency
        balanceStability: 0.30,     // Factor 2: balance runway vs income
        cashflowTendency: 0.20,     // Factor 3: positive cashflow tendency
      },
    },

    // Business thresholds and bands (fractions unless noted as INR/count)
    thresholds: {
      // Failed-transaction rate bands — shared by scoring penalties
      // AND risk-factor labels (single copy; do not duplicate)
      failedRateSevere: 0.25,         // >= → severe penalty + 'Severe failed transaction rate'
      failedRateElevated: 0.15,       // >= → elevated penalty + 'Elevated failed transaction rate'
      failedRateMinor: 0.10,          // >= → minor scoring penalty
      failedRateLow: 0.05,            // <  → part of transaction-consistency bonus

      // Transaction history depth
      thinHistoryMin: 20,             // total txns below → thin-history penalty
      veryThinHistoryMin: 10,         // total txns below → strong credit-score penalty
      consistentTxnsMin: 50,          // total txns at/above → consistency bonus

      // Score bands
      weakComponentScore: 50,         // component below → risk factor
      strongComponentScore: 70,       // component at/above → protective factor / STABLE
      excellentCreditScore: 75,       // credit score at/above → 'Excellent credit behavior'
      riskFactorCountHigh: 3,         // risk factors at/above → HIGH risk

      // Liquidity
      thinLiquidityRatio: 0.15,       // balance/monthly-inflow below → 'Thin liquidity buffer'
      lowBufferRatio: 0.25,           // balance below this share of inflow → small penalty

      // Withdrawal behavior
      highValueWithdrawal: 5000,      // avg withdrawal above (INR) → HIGH_VALUE_WITHDRAWALS
      frequentWithdrawalCount: 20,    // withdrawal count above → FREQUENT_WITHDRAWALS
      irregularWithdrawalMultiple: 5, // largest > N× avg → IRRUGLAR_WITHDRAWALS

      // Savings profile
      stableSaverMinRatio: 0.7,       // savings ratio above → Stable Saver eligible
      stableSaverDepositMultiple: 3,  // depositCount > N× withdrawalCount
      highWithdrawalRatio: 0.8,       // avg withdrawal > N× avg deposit
      seasonalMaxDepositCount: 3,     // depositCount below → Seasonal Earner candidate
      seasonalMinDeposits: 10000,     // total deposits above (INR)
      merchantRatioTolerance: 0.3,    // |withdrawal/deposit ratio − 1| below → Merchant
      depositsBonusMultiple: 2,       // deposits > N× withdrawals → savings bonus
    },

    // Risk classification bands (consumed by classifyRisk in domain/analysis)
    riskThresholds: {
      low: 70,    // credit score at/above with no risk factors → LOW
      medium: 40, // below → HIGH band
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
