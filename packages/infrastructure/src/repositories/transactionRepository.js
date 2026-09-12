// Transaction Repository - Database operations for transactions

const db = require('shared/database');
const logger = require('shared/utils/logger');

class TransactionRepository {
  /**
   * Create a new transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Object>} Created transaction
   */
  async create(transactionData) {
    const { userId, amount, type, status, category, description } = transactionData;

    const query = `
      INSERT INTO transactions (user_id, amount, type, status, category, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_id as "userId", amount, type, status, category,
               description, timestamp, created_at as "createdAt"
    `;

    const result = await db.query(query, [userId, amount, type, status, category, description]);
    logger.info('Transaction created', { transactionId: result.rows[0].id, userId });
    return result.rows[0];
  }

  /**
   * Find transactions by user ID
   * @param {string} userId - User UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of transactions
   */
  async findByUserId(userId, options = {}) {
    const { startDate, endDate, limit = 100, offset = 0 } = options;

    let query = `
      SELECT id, user_id as "userId", amount, type, status, category,
             description, timestamp, created_at as "createdAt"
      FROM transactions
      WHERE user_id = $1
    `;

    const params = [userId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND timestamp >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND timestamp <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get transaction summary for a user
   * @param {string} userId - User UUID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Transaction summary
   */
  async getTransactionSummary(userId, startDate, endDate) {
    const query = `
      SELECT
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN type = 'CREDIT' THEN 1 END) as credit_transactions,
        COUNT(CASE WHEN type = 'DEBIT' THEN 1 END) as debit_transactions,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_transactions,
        COALESCE(SUM(CASE WHEN type = 'CREDIT' AND status = 'SUCCESS' THEN amount ELSE 0 END), 0) as total_credits,
        COALESCE(SUM(CASE WHEN type = 'DEBIT' AND status = 'SUCCESS' THEN amount ELSE 0 END), 0) as total_debits,
        COALESCE(AVG(CASE WHEN type = 'CREDIT' AND status = 'SUCCESS' THEN amount ELSE NULL END), 0) as avg_credit,
        COALESCE(AVG(CASE WHEN type = 'DEBIT' AND status = 'SUCCESS' THEN amount ELSE NULL END), 0) as avg_debit
      FROM transactions
      WHERE user_id = $1
        AND timestamp >= $2
        AND timestamp <= $3
    `;

    const result = await db.query(query, [userId, startDate, endDate]);
    return result.rows[0];
  }

  /**
   * Get monthly transaction aggregates
   * @param {string} userId - User UUID
   * @param {number} months - Number of months
   * @returns {Promise<Array>} Monthly aggregates
   */
  async getMonthlyAggregates(userId, months = 6) {
    const query = `
      SELECT
        DATE_TRUNC('month', timestamp::timestamp) as month,
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN type = 'CREDIT' AND status = 'SUCCESS' THEN 1 END) as credit_count,
        COUNT(CASE WHEN type = 'DEBIT' AND status = 'SUCCESS' THEN 1 END) as debit_count,
        COALESCE(SUM(CASE WHEN type = 'CREDIT' AND status = 'SUCCESS' THEN amount ELSE 0 END), 0) as total_inflow,
        COALESCE(SUM(CASE WHEN type = 'DEBIT' AND status = 'SUCCESS' THEN amount ELSE 0 END), 0) as total_outflow,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_count
      FROM transactions
      WHERE user_id = $1
        AND timestamp::timestamp >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * $2)
      GROUP BY DATE_TRUNC('month', timestamp::timestamp)
      ORDER BY month DESC
    `;

    const result = await db.query(query, [userId, months]);
    return result.rows;
  }

  /**
   * Get income frequency analysis
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Income frequency data
   */
  async getIncomeFrequency(userId) {
    const query = `
      SELECT
        COUNT(DISTINCT DATE_TRUNC('week', timestamp::timestamp)) as unique_weeks,
        COUNT(DISTINCT DATE_TRUNC('month', timestamp::timestamp)) as unique_months,
        COUNT(CASE WHEN type = 'CREDIT' THEN 1 END) as income_count,
        COALESCE(SUM(CASE WHEN type = 'CREDIT' AND status = 'SUCCESS' THEN amount ELSE 0 END), 0) as total_income
      FROM transactions
      WHERE user_id = $1
        AND timestamp::timestamp >= CURRENT_DATE - INTERVAL '6 months'
    `;

    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Get recent failed transactions
   * @param {string} userId - User UUID
   * @param {number} limit - Limit
   * @returns {Promise<Array>} Failed transactions
   */
  async getRecentFailedTransactions(userId, limit = 10) {
    const query = `
      SELECT id, user_id as "userId", amount, type, status, category,
             description, timestamp, created_at as "createdAt"
      FROM transactions
      WHERE user_id = $1 AND status = 'FAILED'
      ORDER BY timestamp DESC
      LIMIT $2
    `;

    const result = await db.query(query, [userId, limit]);
    return result.rows;
  }
}

module.exports = new TransactionRepository();
