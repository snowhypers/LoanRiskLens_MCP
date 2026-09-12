// Credit Decision Agent

const config = require('shared/config');
const helpers = require('shared/utils/helpers');
const logger = require('shared/utils/logger');

/**
 * Credit Decision Agent
 *
 * Generates loan recommendation with:
 * - APPROVED
 * - REVIEW
 * - REJECTED
 *
 * Also generates:
 * - Recommended loan amount
 * - Repayment confidence
 * - Risk explanation
 */

class CreditDecisionAgent {
  constructor() {
    this.name = 'CreditDecisionAgent';
    this.description = 'Generates loan recommendation and decision';
  }

  /**
   * Execute credit decision
   * @param {Object} riskClassification - Risk classification data
   * @param {Object} behaviorScore - Behavior scoring data
   * @param {Object} transactionAnalysis - Transaction analysis data
   * @param {Object} savingsAnalysis - Savings analysis data
   * @returns {Object} Credit decision result
   */
  execute(riskClassification, behaviorScore, transactionAnalysis, savingsAnalysis) {
    logger.info('CreditDecisionAgent: Generating credit decision');

    try {
      const creditScore = behaviorScore.creditScore ?? behaviorScore.overallScore;
      const riskLevel = riskClassification.riskLevel;

      // Generate decision
      const decision = helpers.generateCreditDecision(creditScore, riskLevel);

      // Calculate recommended loan amount
      const recommendedAmount = helpers.calculateRecommendedLoanAmount(
        creditScore,
        riskLevel,
        config.loan
      );

      // Calculate repayment confidence
      const repaymentConfidence = helpers.calculateRepaymentConfidence(creditScore, riskLevel);

      // Generate risk explanation
      const riskExplanation = this.generateRiskExplanation(
        riskClassification,
        behaviorScore,
        transactionAnalysis,
        savingsAnalysis
      );

      // Calculate loan terms
      const loanTerms = this.calculateLoanTerms(decision, riskLevel, creditScore);

      const result = {
        agent: this.name,
        timestamp: new Date().toISOString(),
        decision,
        creditScore,
        riskLevel,
        recommendedAmount,
        repaymentConfidence,
        riskExplanation,
        loanTerms,
        conditions: this.generateConditions(decision, riskClassification),
      };

      logger.info('CreditDecisionAgent: Decision generated', {
        decision,
        riskLevel,
        recommendedAmount,
      });

      return result;
    } catch (error) {
      logger.error('CreditDecisionAgent: Decision generation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate risk explanation
   * @param {Object} riskClassification - Risk classification data
   * @param {Object} behaviorScore - Behavior scoring data
   * @param {Object} transactionAnalysis - Transaction analysis data
   * @param {Object} savingsAnalysis - Savings analysis data
   * @returns {string} Risk explanation
   */
  generateRiskExplanation(riskClassification, behaviorScore, transactionAnalysis, savingsAnalysis) {
    const explanations = [];

    // Overall score explanation
    const scoreForExplanation = behaviorScore.creditScore ?? behaviorScore.overallScore;

    if (scoreForExplanation >= 75) {
      explanations.push(`Strong credit score of ${scoreForExplanation}`);
    } else if (scoreForExplanation >= 50) {
      explanations.push(`Moderate credit score of ${scoreForExplanation}`);
    } else {
      explanations.push(`Weak credit score of ${scoreForExplanation}`);
    }

    // Risk factor explanations
    if (riskClassification.riskFactors.length > 0) {
      explanations.push(`Primary risk factors: ${riskClassification.riskFactors.slice(0, 2).join(' and ')}`);
    }

    // Strength explanations
    if (riskClassification.protectiveFactors.length > 0) {
      explanations.push(`Key strengths: ${riskClassification.protectiveFactors.slice(0, 2).join(' and ')}`);
    }

    // Transaction-specific explanation
    if (transactionAnalysis.successRate >= 95) {
      explanations.push('Excellent transaction success rate demonstrates reliable payment behavior');
    } else if (transactionAnalysis.successRate < 85) {
      explanations.push('Transaction success rate indicates payment reliability concerns');
    }

    // Savings-specific explanation
    if (transactionAnalysis.averageMonthlyInflow > 0 &&
        savingsAnalysis.currentBalance > transactionAnalysis.averageMonthlyInflow * 3) {
      explanations.push('Strong liquidity buffer provides repayment cushion');
    }

    return explanations.join('. ') + '.';
  }

  /**
   * Calculate loan terms
   * @param {string} decision - Credit decision
   * @param {string} riskLevel - Risk level
   * @param {number} creditScore - Credit score
   * @returns {Object} Loan terms
   */
  calculateLoanTerms(decision, riskLevel, creditScore) {
    if (decision === 'REJECTED') {
      return {
        status: 'NOT_APPLICABLE',
        message: 'No loan terms available for rejected applications',
      };
    }

    // Base interest rate by risk level
    let baseInterestRate = 12.0; // Default
    let maxTenureMonths = 24;

    switch (riskLevel) {
      case 'LOW':
        baseInterestRate = 10.5;
        maxTenureMonths = 36;
        break;
      case 'MEDIUM':
        baseInterestRate = 14.0;
        maxTenureMonths = 24;
        break;
      case 'HIGH':
        baseInterestRate = 18.0;
        maxTenureMonths = 12;
        break;
    }

    // Adjust interest rate based on credit score
    if (creditScore >= 80) {
      baseInterestRate -= 1.5;
    } else if (creditScore >= 70) {
      baseInterestRate -= 0.5;
    } else if (creditScore < 50) {
      baseInterestRate += 2.0;
    }

    return {
      baseInterestRate: Math.round(baseInterestRate * 10) / 10,
      maxTenureMonths,
      processingFeePercent: riskLevel === 'LOW' ? 1.0 : riskLevel === 'MEDIUM' ? 1.5 : 2.0,
      riskPremium: riskLevel === 'HIGH' ? 'REQUIRED' : 'NOT_REQUIRED',
    };
  }

  /**
   * Generate conditions based on decision and risk
   * @param {string} decision - Credit decision
   * @param {Object} riskClassification - Risk classification data
   * @returns {Array} Array of conditions
   */
  generateConditions(decision, riskClassification) {
    const conditions = [];

    if (decision === 'APPROVED') {
      if (riskClassification.riskLevel === 'LOW') {
        conditions.push('Standard terms apply');
        conditions.push('Auto-approved for amounts up to INR 50,000');
      } else if (riskClassification.riskLevel === 'MEDIUM') {
        conditions.push('Enhanced monitoring during repayment period');
        conditions.push('Minimum monthly deposits required');
        conditions.push('Auto-debit for repayments');
      }
    } else if (decision === 'REVIEW') {
      conditions.push('Manual underwriting review required');
      conditions.push('Additional income documentation may be requested');
      conditions.push('Collateral or guarantor may be required');
    } else if (decision === 'REJECTED') {
      conditions.push('Application declined based on risk assessment');
      conditions.push('User advised to improve credit behavior');
      conditions.push('Reconsideration available after 6 months');
    }

    // Add any risk-specific conditions
    if (riskClassification.riskFactors.includes('High number of failed transactions')) {
      conditions.push('Proof of payment for pending transactions required');
    }

    return conditions;
  }
}

module.exports = new CreditDecisionAgent();
