// Behavior Scoring Agent
//
// This agent owns NO scoring math. All weighted scoring — the
// 0.35/0.40/0.25 weights, component scores, overall weighted score,
// breakdown contributions and credit-score adjustments — lives in the
// domain scoring engine (@loan-risk-lens/domain/scoring) and is reused
// from here so both workflow and creditService paths share one formula.

const scoringEngine = require('@loan-risk-lens/domain/scoring');
const config = require('shared/config');
const logger = require('shared/utils/logger');

/**
 * Behavior Scoring Agent
 *
 * Score Formula (weights from shared/config — single source of truth):
 * score = (transactionConsistency * 0.35)
 *       + (savingsDiscipline * 0.40)
 *       + (cashflowStability * 0.25)
 */

class BehaviorScoringAgent {
  constructor() {
    this.name = 'BehaviorScoringAgent';
    this.description = 'Delegates weighted financial behavior scoring to the domain scoring engine';
  }

  /**
   * Execute the behavior scoring
   *
   * Delegates ALL scoring math to the domain scoring engine — the single
   * source of truth shared with creditService (API/MCP path):
   * - calculateOverallBehaviorScore: component scores, weighted overall
   *   score (config.scoring.weights) and breakdown contributions
   * - calculateCreditScore: credit-score bonuses/penalties
   *
   * @param {Object} transactionAnalysis - Transaction analysis data
   * @param {Object} savingsAnalysis - Savings analysis data
   * @returns {Object} Behavior scoring result
   */
  execute(transactionAnalysis, savingsAnalysis) {
    logger.info('BehaviorScoringAgent: Starting scoring');

    try {
      const scoringTransactionAnalysis = this.toScoringTransactionAnalysis(transactionAnalysis);
      const scoringSavingsAnalysis = this.toScoringSavingsAnalysis(savingsAnalysis);

      // Delegate component + weighted scoring math to the domain engine
      const behaviorScore = scoringEngine.calculateOverallBehaviorScore(
        scoringTransactionAnalysis,
        scoringSavingsAnalysis
      );

      // Delegate credit-score adjustments to the domain engine as well
      const creditScore = scoringEngine.calculateCreditScore(
        scoringTransactionAnalysis,
        scoringSavingsAnalysis,
        behaviorScore
      );

      const componentScores = {
        transactionConsistency: behaviorScore.transactionScore,
        savingsDiscipline: behaviorScore.savingsScore,
        cashflowStability: behaviorScore.cashflowScore,
      };

      // Agent-specific stability reporting (consumes engine component scores)
      const stabilityIndicators = this.generateStabilityIndicators(componentScores);

      const result = {
        agent: this.name,
        timestamp: new Date().toISOString(),
        overallScore: behaviorScore.overallScore,
        creditScore,
        componentScores,
        stabilityIndicators,
        weights: config.scoring.weights,
        breakdown: behaviorScore.breakdown,
      };

      logger.info('BehaviorScoringAgent: Scoring complete', {
        overallScore: result.overallScore,
        creditScore: result.creditScore,
        components: componentScores,
      });

      return result;
    } catch (error) {
      logger.error('BehaviorScoringAgent: Scoring failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate stability indicators (stable threshold from shared/config)
   * @param {Object} componentScores - Individual component scores
   * @returns {Object} Stability indicators
   */
  generateStabilityIndicators(componentScores) {
    const stableThreshold = config.scoring.thresholds.strongComponentScore;

    return {
      transactionStability: componentScores.transactionConsistency >= stableThreshold ? 'STABLE' : 'VOLATILE',
      savingsStability: componentScores.savingsDiscipline >= stableThreshold ? 'STABLE' : 'VOLATILE',
      cashflowStability: componentScores.cashflowStability >= stableThreshold ? 'STABLE' : 'VOLATILE',
      overallStability: this.calculateOverallStability(componentScores, stableThreshold),
    };
  }

  /**
   * Calculate overall stability (stable threshold from shared/config)
   * @param {Object} componentScores - Individual component scores
   * @param {number} stableThreshold - Threshold for a component to count as stable
   * @returns {string} Overall stability status
   */
  calculateOverallStability(componentScores, stableThreshold) {
    const stableCount = [
      componentScores.transactionConsistency >= stableThreshold,
      componentScores.savingsDiscipline >= stableThreshold,
      componentScores.cashflowStability >= stableThreshold,
    ].filter(Boolean).length;

    if (stableCount >= 3) return 'HIGHLY_STABLE';
    if (stableCount >= 2) return 'MODERATELY_STABLE';
    if (stableCount >= 1) return 'MIXED';
    return 'UNSTABLE';
  }

  toScoringTransactionAnalysis(transactionAnalysis) {
    return {
      totalTransactions: transactionAnalysis.totalTransactions || 0,
      failedTransactions: transactionAnalysis.failedTransactions || 0,
      incomeConsistencyScore: transactionAnalysis.incomeConsistencyScore || 50,
      averageMonthlyInflow: transactionAnalysis.averageMonthlyInflow || 0,
      averageMonthlyOutflow: transactionAnalysis.averageMonthlyOutflow || 0,
    };
  }

  toScoringSavingsAnalysis(savingsAnalysis) {
    return {
      totalDeposits: savingsAnalysis.totalDeposits || 0,
      totalWithdrawals: savingsAnalysis.totalWithdrawals || 0,
      currentBalance: savingsAnalysis.currentBalance || 0,
      savingsFrequency: savingsAnalysis.savingsFrequency || 0,
      averageDeposit: savingsAnalysis.averageDeposit || 0,
      averageWithdrawal: savingsAnalysis.averageWithdrawal || 0,
    };
  }
}

module.exports = new BehaviorScoringAgent();
