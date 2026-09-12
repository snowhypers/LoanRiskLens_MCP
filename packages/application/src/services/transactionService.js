// Transaction Service - Business logic for transactions

const transactionRepository = require('@loan-risk-lens/infrastructure/repositories/transaction');
const savingsRepository = require('@loan-risk-lens/infrastructure/repositories/savings');
const config = require('shared/config');
const helpers = require('shared/utils/helpers');
const logger = require('shared/utils/logger');

class TransactionService {
  /**
   * Create a new transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Object>} Created transaction
   */
  async createTransaction(transactionData) {
    const transaction = await transactionRepository.create(transactionData);

    // Update savings balance if it's a SUCCESS transaction.
    // NOTE: pg returns DECIMAL columns as strings, so `amount` must be
    // parsed before arithmetic — otherwise `currentBalance + amount`
    // concatenates strings for CREDIT and the balance overflows
    // DECIMAL(12,2) ("numeric field overflow"). Found by E2E testing.
    if (transaction.status === 'SUCCESS') {
      const amount = parseFloat(transaction.amount) || 0;
      const balanceUpdate = {
        userId: transaction.userId,
        depositAmount: transaction.type === 'CREDIT' ? amount : 0,
        withdrawalAmount: transaction.type === 'DEBIT' ? amount : 0,
      };

      // Get current balance and calculate new balance
      const currentBalance = await savingsRepository.getCurrentBalance(transaction.userId);
      const newBalance = transaction.type === 'CREDIT'
        ? currentBalance + amount
        : currentBalance - amount;

      balanceUpdate.balance = newBalance;
      await savingsRepository.create(balanceUpdate);
    }

    return transaction;
  }

  /**
   * Get user's transaction analysis
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Transaction analysis
   */
  async analyzeTransactions(userId) {
    const { startDate, endDate } = helpers.getDateRange(6);

    // Get transaction summary
    const summary = await transactionRepository.getTransactionSummary(userId, startDate, endDate);

    // Get monthly aggregates
    const monthlyAggregates = await transactionRepository.getMonthlyAggregates(userId, 6);

    // Get income frequency
    const incomeFrequency = await transactionRepository.getIncomeFrequency(userId);

    // Calculate income consistency score based on frequency
    const totalIncomeCount = parseInt(incomeFrequency.income_count) || 0;
    const uniqueWeeks = parseInt(incomeFrequency.unique_weeks) || 0;
    const incomeConsistencyScore = totalIncomeCount > 0
      ? Math.min(100, (uniqueWeeks / 24) * 100 + 50)
      : 50;

    return {
      totalTransactions: parseInt(summary.total_transactions) || 0,
      creditTransactions: parseInt(summary.credit_transactions) || 0,
      debitTransactions: parseInt(summary.debit_transactions) || 0,
      failedTransactions: parseInt(summary.failed_transactions) || 0,
      totalCredits: parseFloat(summary.total_credits) || 0,
      totalDebits: parseFloat(summary.total_debits) || 0,
      averageCredit: parseFloat(summary.avg_credit) || 0,
      averageDebit: parseFloat(summary.avg_debit) || 0,
      monthlyInflow: parseFloat(summary.total_credits) / 6 || 0,
      monthlyOutflow: parseFloat(summary.total_debits) / 6 || 0,
      averageMonthlyInflow: parseFloat(summary.total_credits) / 6 || 0,
      averageMonthlyOutflow: parseFloat(summary.total_debits) / 6 || 0,
      incomeConsistencyScore: Math.round(incomeConsistencyScore),
      monthlyAggregates: monthlyAggregates.map(m => ({
        month: m.month,
        totalTransactions: parseInt(m.total_transactions),
        creditCount: parseInt(m.credit_count),
        debitCount: parseInt(m.debit_count),
        totalInflow: parseFloat(m.total_inflow),
        totalOutflow: parseFloat(m.total_outflow),
        failedCount: parseInt(m.failed_count),
      })),
    };
  }

  /**
   * Get transactions with pagination
   * @param {string} userId - User UUID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated transactions
   */
  async getTransactions(userId, options = {}) {
    const transactions = await transactionRepository.findByUserId(userId, options);
    return transactions;
  }

  /**
   * Get failed transactions
   * @param {string} userId - User UUID
   * @param {number} limit - Limit
   * @returns {Promise<Array>} Failed transactions
   */
  async getFailedTransactions(userId, limit = 10) {
    return transactionRepository.getRecentFailedTransactions(userId, limit);
  }
}

module.exports = new TransactionService();
