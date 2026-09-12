// Credit Service - Business logic for creditworthiness analysis

const transactionService = require('./transactionService');
const savingsService = require('./savingsService');
const reportRepository = require('@loan-risk-lens/infrastructure/repositories/report');
const userRepository = require('@loan-risk-lens/infrastructure/repositories/user');
const config = require('shared/config');
const helpers = require('shared/utils/helpers');
const scoringEngine = require('@loan-risk-lens/domain/scoring');
const analysisEngine = require('@loan-risk-lens/domain/analysis');
const logger = require('shared/utils/logger');

class CreditService {
  /**
   * Analyze creditworthiness for a user
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Creditworthiness analysis
   */
  async analyzeCreditworthiness(userId) {
    logger.info('Analyzing creditworthiness', { userId });
    await this.assertUserExists(userId);

    // Get transaction analysis
    const transactionAnalysis = await transactionService.analyzeTransactions(userId);

    // Get savings analysis
    const savingsAnalysis = await savingsService.analyzeSavings(userId);

    // Calculate overall behavior score
    const behaviorScore = scoringEngine.calculateOverallBehaviorScore(
      transactionAnalysis,
      savingsAnalysis
    );

    // Calculate final credit score
    const creditScore = scoringEngine.calculateCreditScore(
      transactionAnalysis,
      savingsAnalysis,
      behaviorScore
    );

    // Classify risk level
    const riskClassification = analysisEngine.classifyRisk({
      creditScore,
      transactionScore: behaviorScore.transactionScore,
      savingsScore: behaviorScore.savingsScore,
      cashflowScore: behaviorScore.cashflowScore,
      failedRate: transactionAnalysis.totalTransactions > 0
        ? transactionAnalysis.failedTransactions / transactionAnalysis.totalTransactions
        : 0,
      currentBalance: savingsAnalysis.currentBalance,
      totalDeposits: savingsAnalysis.totalDeposits,
      totalWithdrawals: savingsAnalysis.totalWithdrawals,
      liquidityRatio: transactionAnalysis.averageMonthlyInflow > 0
        ? savingsAnalysis.currentBalance / transactionAnalysis.averageMonthlyInflow
        : 0,
    });

    // Calculate recommended loan amount
    const recommendedLoanAmount = helpers.calculateRecommendedLoanAmount(
      creditScore,
      riskClassification.riskLevel,
      config.loan
    );

    // Calculate repayment confidence
    const repaymentConfidence = helpers.calculateRepaymentConfidence(
      creditScore,
      riskClassification.riskLevel
    );

    // Generate decision
    const decision = helpers.generateCreditDecision(
      creditScore,
      riskClassification.riskLevel
    );

    // Generate explanation
    const explanation = this.generateExplanation(
      behaviorScore,
      riskClassification,
      transactionAnalysis,
      savingsAnalysis
    );

    const result = {
      creditScore,
      riskLevel: riskClassification.riskLevel,
      recommendedLoanAmount,
      repaymentConfidence,
      decision,
      explanation,
      details: {
        behaviorScore,
        riskClassification,
        transactionAnalysis: {
          totalTransactions: transactionAnalysis.totalTransactions,
          incomeConsistencyScore: transactionAnalysis.incomeConsistencyScore,
          successRate: transactionAnalysis.totalTransactions > 0
            ? ((transactionAnalysis.totalTransactions - transactionAnalysis.failedTransactions) / transactionAnalysis.totalTransactions * 100).toFixed(1)
            : 0,
        },
        savingsAnalysis: {
          totalDeposits: savingsAnalysis.totalDeposits,
          totalWithdrawals: savingsAnalysis.totalWithdrawals,
          currentBalance: savingsAnalysis.currentBalance,
        },
      },
    };

    // Save the report
    try {
      await reportRepository.create({
        userId,
        creditScore,
        riskLevel: riskClassification.riskLevel,
        recommendedAmount: recommendedLoanAmount,
        recommendation: decision,
        explanation,
        details: result.details,
      });
    } catch (error) {
      logger.error('Failed to save underwriting report', { userId, error: error.message });
    }

    return result;
  }

  /**
   * Analyze financial behavior for a user
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Financial behavior analysis
   */
  async analyzeFinancialBehavior(userId) {
    logger.info('Analyzing financial behavior', { userId });
    await this.assertUserExists(userId);

    // Get transaction analysis
    const transactionAnalysis = await transactionService.analyzeTransactions(userId);

    // Get savings analysis
    const savingsAnalysis = await savingsService.analyzeSavings(userId);

    // Analyze savings profile
    const savingsProfile = analysisEngine.analyzeSavingsProfile({
      totalDeposits: savingsAnalysis.totalDeposits,
      totalWithdrawals: savingsAnalysis.totalWithdrawals,
      depositCount: savingsAnalysis.depositCount,
      withdrawalCount: savingsAnalysis.withdrawalCount,
      averageDeposit: savingsAnalysis.averageDeposit,
      averageWithdrawal: savingsAnalysis.averageWithdrawal,
    });

    // Analyze transaction patterns
    const transactionPatterns = analysisEngine.analyzeTransactionPatterns({
      totalTransactions: transactionAnalysis.totalTransactions,
      creditTransactions: transactionAnalysis.creditTransactions,
      debitTransactions: transactionAnalysis.debitTransactions,
      failedTransactions: transactionAnalysis.failedTransactions,
      monthlyInflow: transactionAnalysis.monthlyInflow,
      monthlyOutflow: transactionAnalysis.monthlyOutflow,
    });

    // Analyze withdrawal behavior
    const withdrawalBehavior = analysisEngine.analyzeWithdrawalBehavior({
      totalWithdrawals: savingsAnalysis.totalWithdrawals,
      withdrawalCount: savingsAnalysis.withdrawalCount,
      averageWithdrawal: savingsAnalysis.averageWithdrawal,
      largestWithdrawal: savingsAnalysis.largestWithdrawal,
    });

    // Calculate cashflow stability
    let cashflowStability = 'MEDIUM';
    if (transactionPatterns.inflowOutflowRatio > 1.5 && transactionPatterns.incomeConsistencyScore > 70) {
      cashflowStability = 'HIGH';
    } else if (transactionPatterns.inflowOutflowRatio < 1.0 || transactionPatterns.incomeConsistencyScore < 50) {
      cashflowStability = 'LOW';
    }

    return {
      behaviorProfile: savingsProfile.profile,
      savingsScore: savingsProfile.profileScore,
      cashflowStability,
      withdrawalBehavior: withdrawalBehavior.behavior,
      details: {
        savingsProfile,
        transactionPatterns,
        withdrawalBehavior,
        cashflowHealth: transactionPatterns.cashFlowHealth,
      },
    };
  }

  /**
   * Generate underwriting report
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Underwriting report
   */
  async generateUnderwritingReport(userId) {
    // Get creditworthiness analysis
    const creditworthiness = await this.analyzeCreditworthiness(userId);

    // Get financial behavior analysis
    const financialBehavior = await this.analyzeFinancialBehavior(userId);

    // Get latest saved report
    const savedReport = await reportRepository.getLatestByUserId(userId);

    return {
      userId,
      reportDate: new Date().toISOString(),
      creditScore: creditworthiness.creditScore,
      riskLevel: creditworthiness.riskLevel,
      recommendation: creditworthiness.decision,
      recommendedAmount: creditworthiness.recommendedLoanAmount,
      repaymentConfidence: creditworthiness.repaymentConfidence,
      explanation: creditworthiness.explanation,
      financialBehavior: {
        profile: financialBehavior.behaviorProfile,
        savingsScore: financialBehavior.savingsScore,
        cashflowStability: financialBehavior.cashflowStability,
        withdrawalBehavior: financialBehavior.withdrawalBehavior,
      },
      riskFactors: creditworthiness.details.riskClassification.riskFactors,
      protectiveFactors: creditworthiness.details.riskClassification.protectiveFactors,
      scoreBreakdown: {
        overall: creditworthiness.details.behaviorScore.overallScore,
        transactionConsistency: creditworthiness.details.behaviorScore.transactionScore,
        savingsDiscipline: creditworthiness.details.behaviorScore.savingsScore,
        cashflowStability: creditworthiness.details.behaviorScore.cashflowScore,
      },
      savedReportId: savedReport?.id,
    };
  }

  /**
   * Generate human-readable explanation
   * @param {Object} behaviorScore - Behavior score breakdown
   * @param {Object} riskClassification - Risk classification
   * @param {Object} transactionAnalysis - Transaction analysis
   * @param {Object} savingsAnalysis - Savings analysis
   * @returns {string} Human-readable explanation
   */
  generateExplanation(behaviorScore, riskClassification, transactionAnalysis, savingsAnalysis) {
    const explanations = [];

    // Transaction consistency
    if (behaviorScore.transactionScore >= 70) {
      explanations.push('consistent transaction patterns and reliable payment behavior');
    } else if (behaviorScore.transactionScore < 50) {
      explanations.push('irregular transaction patterns requiring attention');
    }

    // Savings discipline
    if (behaviorScore.savingsScore >= 70) {
      explanations.push('excellent savings discipline with regular deposits');
    } else if (behaviorScore.savingsScore < 50) {
      explanations.push('weak savings habits that need improvement');
    }

    // Cashflow stability
    if (behaviorScore.cashflowScore >= 70) {
      explanations.push('stable and sustainable cash flow management');
    } else if (behaviorScore.cashflowScore < 50) {
      explanations.push('unstable cash flow patterns');
    }

    // Risk factors
    if (riskClassification.riskFactors.length > 0) {
      explanations.push(`risk factors include: ${riskClassification.riskFactors.join(', ')}`);
    }

    // Protective factors
    if (riskClassification.protectiveFactors.length > 0) {
      explanations.push(`positive factors: ${riskClassification.protectiveFactors.join(', ')}`);
    }

    // Financial health
    if (transactionAnalysis.monthlyInflow > transactionAnalysis.monthlyOutflow * 1.5) {
      explanations.push('healthy surplus cash flow');
    }

    if (savingsAnalysis.currentBalance > savingsAnalysis.averageMonthlyInflow * 3) {
      explanations.push('strong liquidity buffer');
    }

    const baseExplanation = explanations.length > 0
      ? explanations.join('. ')
      : 'User demonstrates average financial behavior across measured dimensions.';

    return `${baseExplanation}. ${this.getRecommendationSummary(riskClassification.riskLevel, behaviorScore.overallScore)}`;
  }

  /**
   * Get recommendation summary text
   * @param {string} riskLevel - Risk level
   * @param {number} score - Overall score
   * @returns {string} Recommendation summary
   */
  getRecommendationSummary(riskLevel, score) {
    if (riskLevel === 'LOW' && score >= 70) {
      return 'Recommended for standard lending products with competitive rates.';
    } else if (riskLevel === 'LOW') {
      return 'Eligible for credit with standard terms and monitoring.';
    } else if (riskLevel === 'MEDIUM') {
      return 'Recommended for conservative lending with enhanced monitoring.';
    } else {
      return 'Credit application requires manual review and additional verification.';
    }
  }

  async assertUserExists(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.name = 'NotFoundError';
      throw error;
    }
    return user;
  }
}

module.exports = new CreditService();
