// Savings Service - Business logic for savings analysis

const savingsRepository = require('@loan-risk-lens/infrastructure/repositories/savings');
const logger = require('shared/utils/logger');

class SavingsService {
  /**
   * Create a new savings record
   * @param {Object} savingsData - Savings data
   * @returns {Promise<Object>} Created record
   */
  async createSavingsRecord(savingsData) {
    return savingsRepository.create(savingsData);
  }

  /**
   * Get user's savings analysis
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Savings analysis
   */
  async analyzeSavings(userId) {
    // Get savings summary
    const summary = await savingsRepository.getSavingsSummary(userId);

    // Get savings trend
    const trend = await savingsRepository.getSavingsTrend(userId, 6);

    // Get current balance
    const currentBalance = await savingsRepository.getCurrentBalance(userId);

    // Calculate metrics
    const totalDeposits = parseFloat(summary.total_deposits) || 0;
    const totalWithdrawals = parseFloat(summary.total_withdrawals) || 0;
    const depositCount = parseInt(summary.deposit_count) || 0;
    const withdrawalCount = parseInt(summary.withdrawal_count) || 0;

    return {
      totalDeposits,
      totalWithdrawals,
      netSavings: totalDeposits - totalWithdrawals,
      currentBalance,
      depositCount,
      withdrawalCount,
      averageDeposit: depositCount > 0 ? totalDeposits / depositCount : 0,
      averageWithdrawal: withdrawalCount > 0 ? totalWithdrawals / withdrawalCount : 0,
      averageDepositAmount: depositCount > 0 ? totalDeposits / depositCount : 0,
      averageWithdrawalAmount: withdrawalCount > 0 ? totalWithdrawals / withdrawalCount : 0,
      largestDeposit: parseFloat(summary.largest_deposit) || 0,
      largestWithdrawal: parseFloat(summary.largest_withdrawal) || 0,
      highestBalance: parseFloat(summary.highest_balance) || 0,
      savingsFrequency: depositCount > 0 ? depositCount / 6 : 0,
      trend: trend.map(t => ({
        month: t.month,
        totalDeposits: parseFloat(t.total_deposits),
        totalWithdrawals: parseFloat(t.total_withdrawals),
        avgBalance: parseFloat(t.avg_balance),
        endBalance: parseFloat(t.end_balance),
      })),
    };
  }

  /**
   * Get savings records with pagination
   * @param {string} userId - User UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Savings records
   */
  async getSavingsRecords(userId, options = {}) {
    return savingsRepository.findByUserId(userId, options);
  }

  /**
   * Get current balance
   * @param {string} userId - User UUID
   * @returns {Promise<number>} Current balance
   */
  async getCurrentBalance(userId) {
    return savingsRepository.getCurrentBalance(userId);
  }
}

module.exports = new SavingsService();
