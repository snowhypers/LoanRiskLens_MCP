// Savings Repository - Database operations for savings history

const db = require('shared/database');
const logger = require('shared/utils/logger');

class SavingsRepository {
  /**
   * Create a new savings record
   * @param {Object} savingsData - Savings data
   * @returns {Promise<Object>} Created record
   */
  async create(savingsData) {
    const { userId, depositAmount, withdrawalAmount, balance } = savingsData;

    const query = `
      INSERT INTO savings_history (user_id, deposit_amount, withdrawal_amount, balance)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id as "userId", deposit_amount as "depositAmount",
                withdrawal_amount as "withdrawalAmount", balance,
                created_at as "createdAt"
    `;

    const result = await db.query(query, [userId, depositAmount || 0, withdrawalAmount || 0, balance || 0]);
    logger.info('Savings record created', { savingsId: result.rows[0].id, userId });
    return result.rows[0];
  }

  
  /**
   * Find savings records by user ID
   * @param {string} userId - User UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of savings records
   */
  async findByUserId(userId, options = {}) {
    const { limit = 100, offset = 0 } = options;

    const query = `
      SELECT id, user_id as "userId", deposit_amount as "depositAmount",
             withdrawal_amount as "withdrawalAmount", balance,
             created_at as "createdAt"
      FROM savings_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Get savings summary for a user
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Savings summary
   */
  async getSavingsSummary(userId) {
    const query = `
      SELECT
        COUNT(*) as total_records,
        COALESCE(SUM(deposit_amount), 0) as total_deposits,
        COALESCE(SUM(withdrawal_amount), 0) as total_withdrawals,
        COALESCE(AVG(deposit_amount), 0) as avg_deposit,
        COALESCE(AVG(withdrawal_amount), 0) as avg_withdrawal,
        COALESCE(MAX(balance), 0) as highest_balance,
        COALESCE(MAX(deposit_amount), 0) as largest_deposit,
        COALESCE(MAX(withdrawal_amount), 0) as largest_withdrawal,
        COUNT(CASE WHEN deposit_amount > 0 THEN 1 END) as deposit_count,
        COUNT(CASE WHEN withdrawal_amount > 0 THEN 1 END) as withdrawal_count
      FROM savings_history
      WHERE user_id = $1
    `;

    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Get savings trend over time
   * @param {string} userId - User UUID
   * @param {number} months - Number of months
   * @returns {Promise<Array>} Monthly savings trend
   */
  async getSavingsTrend(userId, months = 6) {
    const query = `
      SELECT
        DATE_TRUNC('month', created_at::timestamp) as month,
        COALESCE(SUM(deposit_amount), 0) as total_deposits,
        COALESCE(SUM(withdrawal_amount), 0) as total_withdrawals,
        COALESCE(AVG(balance), 0) as avg_balance,
        COALESCE(MAX(balance), 0) as end_balance
      FROM savings_history
      WHERE user_id = $1
        AND created_at::timestamp >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * $2)
      GROUP BY DATE_TRUNC('month', created_at::timestamp)
      ORDER BY month ASC
    `;

    const result = await db.query(query, [userId, months]);
    return result.rows;
  }

  /**
   * Get latest balance for a user
   * @param {string} userId - User UUID
   * @returns {Promise<number>} Latest balance
   */
  async getLatestBalance(userId) {
    const query = `
      SELECT balance
      FROM savings_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await db.query(query, [userId]);
    return result.rows[0]?.balance || 0;
  }

  /**
   * Get current balance
   * @param {string} userId - User UUID
   * @returns {Promise<number>} Current balance
   */
  async getCurrentBalance(userId) {
    const query = `
      SELECT COALESCE(SUM(deposit_amount) - SUM(withdrawal_amount), 0) as balance
      FROM savings_history
      WHERE user_id = $1
    `;

    const result = await db.query(query, [userId]);
    return parseFloat(result.rows[0].balance) || 0;
  }
}

module.exports = new SavingsRepository();
