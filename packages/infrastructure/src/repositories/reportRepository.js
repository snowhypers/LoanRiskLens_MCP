// Report Repository - Database operations for underwriting reports

const db = require('shared/database');
const logger = require('shared/utils/logger');

class ReportRepository {
  /**
   * Create a new underwriting report
   * @param {Object} reportData - Report data
   * @returns {Promise<Object>} Created report
   */
  async create(reportData) {
    const { userId, creditScore, riskLevel, recommendedAmount, recommendation, explanation, details } = reportData;
    const { v4: uuidv4 } = require('uuid');

    const query = `
      INSERT INTO underwriting_reports
        (id, user_id, credit_score, risk_level, recommended_amount, recommendation, explanation, details)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, user_id as "userId", credit_score as "creditScore",
                risk_level as "riskLevel", recommended_amount as "recommendedAmount",
                recommendation, explanation, details, created_at as "createdAt"
    `;

    const result = await db.query(query, [
      uuidv4(),
      userId,
      creditScore,
      riskLevel,
      recommendedAmount,
      recommendation,
      explanation,
      JSON.stringify(details || {})
    ]);

    logger.info('Underwriting report created', { reportId: result.rows[0].id, userId });
    return result.rows[0];
  }

  /**
   * Find report by ID
   * @param {string} reportId - Report UUID
   * @returns {Promise<Object|null>} Report object or null
   */
  async findById(reportId) {
    const query = `
      SELECT id, user_id as "userId", credit_score as "creditScore",
             risk_level as "riskLevel", recommended_amount as "recommendedAmount",
             recommendation, explanation, details, created_at as "createdAt"
      FROM underwriting_reports
      WHERE id = $1
    `;

    const result = await db.query(query, [reportId]);
    return result.rows[0] || null;
  }

  /**
   * Find reports by user ID
   * @param {string} userId - User UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of reports
   */
  async findByUserId(userId, options = {}) {
    const { limit = 10, offset = 0 } = options;

    const query = `
      SELECT id, user_id as "userId", credit_score as "creditScore",
             risk_level as "riskLevel", recommended_amount as "recommendedAmount",
             recommendation, explanation, details, created_at as "createdAt"
      FROM underwriting_reports
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Get latest report for a user
   * @param {string} userId - User UUID
   * @returns {Promise<Object|null>} Latest report or null
   */
  async getLatestByUserId(userId) {
    const query = `
      SELECT id, user_id as "userId", credit_score as "creditScore",
             risk_level as "riskLevel", recommended_amount as "recommendedAmount",
             recommendation, explanation, details, created_at as "createdAt"
      FROM underwriting_reports
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await db.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Get user's report history
   * @param {string} userId - User UUID
   * @param {number} months - Number of months to look back
   * @returns {Promise<Array>} Report history
   */
  async getReportHistory(userId, months = 6) {
    const query = `
      SELECT id, user_id as "userId", credit_score as "creditScore",
             risk_level as "riskLevel", recommended_amount as "recommendedAmount",
             recommendation, explanation, details, created_at as "createdAt"
      FROM underwriting_reports
      WHERE user_id = $1
        AND created_at >= CURRENT_DATE - INTERVAL '1 month' * $2
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [userId, months]);
    return result.rows;
  }

  /**
   * Update report
   * @param {string} reportId - Report UUID
   * @param {Object} reportData - Updated report data
   * @returns {Promise<Object>} Updated report
   */
  async update(reportId, reportData) {
    const { creditScore, riskLevel, recommendedAmount, recommendation, explanation, details } = reportData;

    const query = `
      UPDATE underwriting_reports
      SET credit_score = COALESCE($2, credit_score),
          risk_level = COALESCE($3, risk_level),
          recommended_amount = COALESCE($4, recommended_amount),
          recommendation = COALESCE($5, recommendation),
          explanation = COALESCE($6, explanation),
          details = COALESCE($7, details)
      WHERE id = $1
      RETURNING id, user_id as "userId", credit_score as "creditScore",
                risk_level as "riskLevel", recommended_amount as "recommendedAmount",
                recommendation, explanation, details, created_at as "createdAt"
    `;

    const result = await db.query(query, [
      reportId,
      creditScore,
      riskLevel,
      recommendedAmount,
      recommendation,
      explanation,
      details ? JSON.stringify(details) : null
    ]);

    return result.rows[0];
  }
}

module.exports = new ReportRepository();
