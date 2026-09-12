// Savings Analysis Agent

const savingsService = require('@loan-risk-lens/application/services/savings');
const analysisEngine = require('@loan-risk-lens/domain/analysis');
const logger = require('shared/utils/logger');

/**
 * Savings Analysis Agent
 *
 * Analyzes:
 * - Savings habits
 * - Deposit consistency
 * - Withdrawal behavior
 * - Liquidity stability
 *
 * Generates:
 * - Savings discipline score
 * - Savings profile (Stable Saver, Seasonal Earner, etc.)
 */

class SavingsAnalysisAgent {
  constructor() {
    this.name = 'SavingsAnalysisAgent';
    this.description = 'Analyzes savings habits and discipline';
  }

  /**
   * Execute the savings analysis
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Savings analysis result
   */
  async execute(userId) {
    logger.info('SavingsAnalysisAgent: Starting analysis', { userId });

    try {
      // Get savings analysis from service
      const analysis = await savingsService.analyzeSavings(userId);

      // Calculate additional metrics
      const result = this.processAnalysis(analysis);

      logger.info('SavingsAnalysisAgent: Analysis complete', {
        userId,
        savingsDisciplineScore: result.savingsDisciplineScore,
        savingsProfile: result.savingsProfile,
      });

      return result;
    } catch (error) {
      logger.error('SavingsAnalysisAgent: Analysis failed', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Process and enrich savings analysis
   * @param {Object} analysis - Raw analysis data
   * @returns {Object>} Processed analysis
   */
  processAnalysis(analysis) {
    // Use the analysis engine to determine savings profile
    const profileAnalysis = analysisEngine.analyzeSavingsProfile({
      totalDeposits: analysis.totalDeposits,
      totalWithdrawals: analysis.totalWithdrawals,
      depositCount: analysis.depositCount,
      withdrawalCount: analysis.withdrawalCount,
      averageDeposit: analysis.averageDeposit,
      averageWithdrawal: analysis.averageWithdrawal,
    });

    // Calculate savings discipline score
    const savingsRatio = analysis.totalDeposits > 0
      ? (analysis.totalDeposits - analysis.totalWithdrawals) / analysis.totalDeposits
      : 0;

    let savingsDisciplineScore = profileAnalysis.profileScore;

    // Adjust based on savings ratio
    if (savingsRatio > 0.7) {
      savingsDisciplineScore = Math.min(100, savingsDisciplineScore + 10);
    } else if (savingsRatio < 0.3) {
      savingsDisciplineScore = Math.max(0, savingsDisciplineScore - 15);
    }

    // Calculate liquidity score
    let liquidityScore = 50;
    if (analysis.currentBalance > 0) {
      const monthsOfRunway = analysis.averageDeposit > 0
        ? analysis.currentBalance / analysis.averageDeposit
        : 0;

      if (monthsOfRunway >= 3) {
        liquidityScore = 90;
      } else if (monthsOfRunway >= 2) {
        liquidityScore = 75;
      } else if (monthsOfRunway >= 1) {
        liquidityScore = 60;
      } else {
        liquidityScore = 40;
      }
    }

    return {
      agent: this.name,
      timestamp: new Date().toISOString(),
      savingsDisciplineScore: Math.round(savingsDisciplineScore),
      savingsProfile: profileAnalysis.profile,
      totalDeposits: analysis.totalDeposits,
      totalWithdrawals: analysis.totalWithdrawals,
      netSavings: analysis.netSavings,
      currentBalance: analysis.currentBalance,
      depositCount: analysis.depositCount,
      withdrawalCount: analysis.withdrawalCount,
      averageDeposit: Math.round(analysis.averageDeposit * 100) / 100,
      averageWithdrawal: Math.round(analysis.averageWithdrawal * 100) / 100,
      savingsFrequency: analysis.savingsFrequency,
      liquidityScore: Math.round(liquidityScore),
      liquidityStatus: this.getLiquidityStatus(liquidityScore),
      trend: analysis.trend || [],
    };
  }

  /**
   * Get liquidity status description
   * @param {number} score - Liquidity score
   * @returns {string} Liquidity status
   */
  getLiquidityStatus(score) {
    if (score >= 75) return 'EXCELLENT';
    if (score >= 60) return 'GOOD';
    if (score >= 40) return 'MODERATE';
    return 'LOW';
  }
}

module.exports = new SavingsAnalysisAgent();
