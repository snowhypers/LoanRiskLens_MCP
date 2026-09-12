// Transaction Analysis Agent

const transactionService = require('@loan-risk-lens/application/services/transaction');
const logger = require('shared/utils/logger');

/**
 * Transaction Analysis Agent
 *
 * Analyzes:
 * - Transaction consistency
 * - Income frequency
 * - Spending behavior
 * - Failed transactions
 * - Monthly inflow/outflow
 *
 * Generates:
 * - Transaction stability score
 * - Income consistency score
 */

class TransactionAnalysisAgent {
  constructor() {
    this.name = 'TransactionAnalysisAgent';
    this.description = 'Analyzes transaction patterns and behavior';
  }

  /**
   * Execute the transaction analysis
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Transaction analysis result
   */
  async execute(userId) {
    logger.info('TransactionAnalysisAgent: Starting analysis', { userId });

    try {
      // Get transaction analysis from service
      const analysis = await transactionService.analyzeTransactions(userId);

      // Calculate additional metrics
      const result = this.processAnalysis(analysis);

      logger.info('TransactionAnalysisAgent: Analysis complete', {
        userId,
        transactionStabilityScore: result.transactionStabilityScore,
        incomeConsistencyScore: result.incomeConsistencyScore,
      });

      return result;
    } catch (error) {
      logger.error('TransactionAnalysisAgent: Analysis failed', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Process and enrich transaction analysis
   * @param {Object} analysis - Raw analysis data
   * @returns {Object} Processed analysis
   */
  processAnalysis(analysis) {
    // Calculate transaction stability score
    const totalTransactions = analysis.totalTransactions || 0;
    const failedTransactions = analysis.failedTransactions || 0;
    const successRate = totalTransactions > 0
      ? ((totalTransactions - failedTransactions) / totalTransactions) * 100
      : 0;

    // Calculate transaction stability
    let transactionStabilityScore = 50; // Default

    if (totalTransactions >= 50) {
      transactionStabilityScore = Math.min(100, 50 + successRate * 0.5);
    } else if (totalTransactions >= 20) {
      transactionStabilityScore = Math.min(90, 40 + successRate * 0.5);
    } else if (totalTransactions >= 5) {
      transactionStabilityScore = Math.min(80, 30 + successRate * 0.5);
    }

    // Income consistency score (already calculated in service)
    const incomeConsistencyScore = analysis.incomeConsistencyScore || 50;

    // Calculate monthly inflow/outflow ratio
    const inflowOutflowRatio = analysis.averageMonthlyOutflow > 0
      ? analysis.averageMonthlyInflow / analysis.averageMonthlyOutflow
      : 0;

    // Determine transaction health
    let transactionHealth = 'STABLE';
    if (successRate < 80 || failedTransactions > 5) {
      transactionHealth = 'RISKY';
    } else if (successRate >= 95 && failedTransactions <= 2) {
      transactionHealth = 'EXCELLENT';
    }

    return {
      agent: this.name,
      timestamp: new Date().toISOString(),
      transactionStabilityScore: Math.round(transactionStabilityScore),
      incomeConsistencyScore: Math.round(incomeConsistencyScore),
      totalTransactions,
      creditTransactions: analysis.creditTransactions,
      debitTransactions: analysis.debitTransactions,
      failedTransactions,
      successRate: Math.round(successRate * 10) / 10,
      averageMonthlyInflow: Math.round(analysis.averageMonthlyInflow * 100) / 100,
      averageMonthlyOutflow: Math.round(analysis.averageMonthlyOutflow * 100) / 100,
      inflowOutflowRatio: Math.round(inflowOutflowRatio * 100) / 100,
      transactionHealth,
      monthlyAggregates: analysis.monthlyAggregates || [],
    };
  }
}

module.exports = new TransactionAnalysisAgent();
