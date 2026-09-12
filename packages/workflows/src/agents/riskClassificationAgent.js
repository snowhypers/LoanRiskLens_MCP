// Risk Classification Agent

const config = require('shared/config');
const analysisEngine = require('@loan-risk-lens/domain/analysis');
const logger = require('shared/utils/logger');

/**
 * Risk Classification Agent
 *
 * Classifies user risk into:
 * - LOW: Stable savings + consistent deposits
 * - MEDIUM: Irregular inflow patterns
 * - HIGH: Frequent withdrawals + failed payments
 */

class RiskClassificationAgent {
  constructor() {
    this.name = 'RiskClassificationAgent';
    this.description = 'Classifies user risk level';
  }

  /**
   * Execute risk classification
   * @param {Object} behaviorScore - Behavior scoring data
   * @param {Object} transactionAnalysis - Transaction analysis data
   * @param {Object} savingsAnalysis - Savings analysis data
   * @returns {Object} Risk classification result
   */
  execute(behaviorScore, transactionAnalysis, savingsAnalysis) {
    logger.info('RiskClassificationAgent: Starting classification');

    try {
      // Combine all scores for classification
      const combinedScores = {
        creditScore: behaviorScore.creditScore ?? behaviorScore.overallScore,
        transactionScore: behaviorScore.componentScores.transactionConsistency,
        savingsScore: behaviorScore.componentScores.savingsDiscipline,
        cashflowScore: behaviorScore.componentScores.cashflowStability,
        failedRate: transactionAnalysis.totalTransactions > 0
          ? transactionAnalysis.failedTransactions / transactionAnalysis.totalTransactions
          : 0,
        currentBalance: savingsAnalysis.currentBalance,
        totalDeposits: savingsAnalysis.totalDeposits,
        totalWithdrawals: savingsAnalysis.totalWithdrawals,
        liquidityRatio: transactionAnalysis.averageMonthlyInflow > 0
          ? savingsAnalysis.currentBalance / transactionAnalysis.averageMonthlyInflow
          : 0,
      };

      // Get classification from analysis engine
      const classification = analysisEngine.classifyRisk(combinedScores);

      // Enhance with specific risk factors
      const enhancedClassification = this.enhanceClassification(
        classification,
        transactionAnalysis,
        savingsAnalysis
      );

      const result = {
        agent: this.name,
        timestamp: new Date().toISOString(),
        ...enhancedClassification,
      };

      logger.info('RiskClassificationAgent: Classification complete', {
        riskLevel: result.riskLevel,
        riskFactorCount: result.riskFactors.length,
        protectiveFactorCount: result.protectiveFactors.length,
      });

      return result;
    } catch (error) {
      logger.error('RiskClassificationAgent: Classification failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Enhance classification with specific risk factors
   * @param {Object} classification - Base classification from engine
   * @param {Object} transactionAnalysis - Transaction analysis data
   * @param {Object} savingsAnalysis - Savings analysis data
   * @returns {Object} Enhanced classification
   */
  enhanceClassification(classification, transactionAnalysis, savingsAnalysis) {
    const riskFactors = [...classification.riskFactors];
    const protectiveFactors = [...classification.protectiveFactors];

    // Add transaction-specific risk factors
    if (transactionAnalysis.failedTransactions > 5) {
      riskFactors.push('High number of failed transactions');
    }

    if (transactionAnalysis.successRate < 85) {
      riskFactors.push('Low transaction success rate');
    }

    if (transactionAnalysis.inflowOutflowRatio < 1.0) {
      riskFactors.push('Negative cash flow (outflow exceeds inflow)');
    }

    // Add savings-specific risk factors
    if (savingsAnalysis.liquidityScore < 50) {
      riskFactors.push('Low liquidity buffer');
    }

    if (savingsAnalysis.averageWithdrawal > savingsAnalysis.averageDeposit * 0.8) {
      riskFactors.push('High withdrawal tendency relative to deposits');
    }

    // Add protective factors
    if (transactionAnalysis.totalTransactions >= 50) {
      protectiveFactors.push('Extensive transaction history');
    }

    if (transactionAnalysis.averageMonthlyInflow > 0 &&
        savingsAnalysis.currentBalance > transactionAnalysis.averageMonthlyInflow * 3) {
      protectiveFactors.push('Strong emergency fund');
    }

    if (transactionAnalysis.successRate >= 95) {
      protectiveFactors.push('Excellent payment reliability');
    }

    // Recalculate risk level based on enhanced factors
    let riskLevel = classification.riskLevel;

    if (riskFactors.length >= 3 && classification.riskLevel !== 'HIGH') {
      riskLevel = 'HIGH';
    } else if (riskFactors.length === 0 && protectiveFactors.length >= 2 && classification.riskLevel !== 'LOW') {
      riskLevel = 'LOW';
    }

    return {
      riskLevel,
      riskFactors: [...new Set(riskFactors)], // Remove duplicates
      protectiveFactors: [...new Set(protectiveFactors)],
      scoreBreakdown: classification.scoreBreakdown,
      riskScore: this.calculateRiskScore(riskFactors, protectiveFactors),
      recommendation: this.getRiskRecommendation(riskLevel),
    };
  }

  /**
   * Calculate numerical risk score
   * @param {Array} riskFactors - Risk factors
   * @param {Array} protectiveFactors - Protective factors
   * @returns {number} Risk score (0-100, lower is better)
   */
  calculateRiskScore(riskFactors, protectiveFactors) {
    // Start with 50 (medium risk)
    let riskScore = 50;

    // Add risk for each risk factor
    riskScore += riskFactors.length * 10;

    // Subtract risk for each protective factor
    riskScore -= protectiveFactors.length * 7;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, riskScore));
  }

  /**
   * Get risk recommendation based on level
   * @param {string} riskLevel - Risk level
   * @returns {string} Risk recommendation
   */
  getRiskRecommendation(riskLevel) {
    switch (riskLevel) {
      case 'LOW':
        return 'Standard lending products with competitive rates recommended. Minimal additional verification required.';
      case 'MEDIUM':
        return 'Conservative lending approach recommended. Enhanced monitoring and moderate interest rates advised.';
      case 'HIGH':
        return 'Manual review required before any credit decision. Additional verification and collateral may be needed.';
      default:
        return 'Insufficient data for risk assessment.';
    }
  }
}

module.exports = new RiskClassificationAgent();
