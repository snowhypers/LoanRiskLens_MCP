// User Repository - Database operations for users

const db = require('shared/database');
const logger = require('shared/utils/logger');

class UserRepository {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async create(userData) {
    const { name, phone, occupation, employerName, monthlyIncome } = userData;

    const query = `
      INSERT INTO users (name, phone, occupation, employer_name, monthly_income)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, phone, occupation, employer_name as "employerName",
                monthly_income as "monthlyIncome", created_at as "createdAt",
                updated_at as "updatedAt"
    `;

    const result = await db.query(query, [name, phone, occupation, employerName, monthlyIncome]);
    logger.info('User created', { userId: result.rows[0].id });
    return result.rows[0];
  }

  /**
   * Find user by ID
   * @param {string} userId - User UUID
   * @returns {Promise<Object|null>} User object or null
   */
  async findById(userId) {
    const query = `
      SELECT id, name, phone, occupation, employer_name as "employerName",
             monthly_income as "monthlyIncome", created_at as "createdAt",
             updated_at as "updatedAt"
      FROM users
      WHERE id = $1
    `;

    const result = await db.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Find user by phone
   * @param {string} phone - Phone number
   * @returns {Promise<Object|null>} User object or null
   */
  async findByPhone(phone) {
    const query = `
      SELECT id, name, phone, occupation, employer_name as "employerName",
             monthly_income as "monthlyIncome", created_at as "createdAt",
             updated_at as "updatedAt"
      FROM users
      WHERE phone = $1
    `;

    const result = await db.query(query, [phone]);
    return result.rows[0] || null;
  }

  /**
   * Update user
   * @param {string} userId - User UUID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user
   */
  async update(userId, userData) {
    const { name, occupation, employerName, monthlyIncome } = userData;

    const query = `
      UPDATE users
      SET name = COALESCE($2, name),
          occupation = COALESCE($3, occupation),
          employer_name = COALESCE($4, employer_name),
          monthly_income = COALESCE($5, monthly_income),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, name, phone, occupation, employer_name as "employerName",
                monthly_income as "monthlyIncome", created_at as "createdAt",
                updated_at as "updatedAt"
    `;

    const result = await db.query(query, [userId, name, occupation, employerName, monthlyIncome]);
    return result.rows[0];
  }

  /**
   * List all users with pagination
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Paginated users
   */
  async list({ limit = 20, offset = 0 }) {
    const query = `
      SELECT id, name, phone, occupation, employer_name as "employerName",
             monthly_income as "monthlyIncome", created_at as "createdAt",
             updated_at as "updatedAt"
      FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `SELECT COUNT(*) as total FROM users`;

    const [usersResult, countResult] = await Promise.all([
      db.query(query, [limit, offset]),
      db.query(countQuery),
    ]);

    return {
      users: usersResult.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset,
    };
  }

  /**
   * Delete user
   * @param {string} userId - User UUID
   * @returns {Promise<boolean>} Success status
   */
  async delete(userId) {
    const query = `DELETE FROM users WHERE id = $1`;
    const result = await db.query(query, [userId]);
    return result.rowCount > 0;
  }
}

module.exports = new UserRepository();
