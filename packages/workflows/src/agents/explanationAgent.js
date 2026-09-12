// Explanation Agent

const logger = require('shared/utils/logger');

/**
 * Explanation Agent
 *
 * Generates explainable underwriting summaries that:
 * - Explain credit decisions in plain language
 * - Highlight key factors that influenced the decision
 * - Provide actionable insights
 */

class ExplanationAgent {
  constructor() {
    this.name = 'ExplanationAgent';
    this.description = 'Generates explainable underwriting summaries';
  }

  /**
   * Execute explanation generation
   * @param {Object} creditDecision - Credit decision data
   * @param {Object} riskClassification - Risk classification data
   * @param {Object} behaviorScore - Behavior scoring data
   * @param {Object} transactionAnalysis - Transaction analysis data
   * @param {Object} savingsAnalysis - Savings analysis data
   * @returns {Object} Explanation result
   */
  execute(creditDecision, riskClassification, behaviorScore, transactionAnalysis, savingsAnalysis) {
    logger.info('ExplanationAgent: Generating explanation');

    try {
      // Generate main explanation
      const mainExplanation = this.generateMainExplanation(
        creditDecision,
        riskClassification,
        behaviorScore
      );

      // Generate detailed breakdown
      const detailedBreakdown = this.generateDetailedBreakdown(
        behaviorScore,
        transactionAnalysis,
        savingsAnalysis
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        creditDecision,
        riskClassification,
        behaviorScore
      );

      // Generate summary for non-technical audience
      const plainLanguageSummary = this.generatePlainLanguageSummary(
        creditDecision,
        riskClassification,
        behaviorScore,
        transactionAnalysis,
        savingsAnalysis
      );

      const result = {
        agent: this.name,
        timestamp: new Date().toISOString(),
        mainExplanation,
        detailedBreakdown,
        recommendations,
        plainLanguageSummary,
        metadata: {
          generatedAt: new Date().toISOString(),
          confidence: this.calculateConfidence(behaviorScore, transactionAnalysis),
          dataQuality: this.assessDataQuality(transactionAnalysis, savingsAnalysis),
        },
      };

      logger.info('ExplanationAgent: Explanation generated', {
        decision: creditDecision.decision,
        riskLevel: creditDecision.riskLevel,
      });

      return result;
    } catch (error) {
      logger.error('ExplanationAgent: Explanation generation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate main explanation
   * @param {Object} creditDecision - Credit decision data
   * @param {Object} riskClassification - Risk classification data
   * @param {Object} behaviorScore - Behavior scoring data
   * @returns {string} Main explanation
   */
  generateMainExplanation(creditDecision, riskClassification, behaviorScore) {
    const { decision, riskLevel, creditScore } = creditDecision;

    let explanation = '';

    switch (decision) {
      case 'APPROVED':
        explanation = `Based on comprehensive analysis of financial behavior, transaction patterns, and savings discipline, this application has been approved. `;
        explanation += `The applicant demonstrates a ${riskLevel.toLowerCase()} risk profile with a credit score of ${creditScore}. `;
        explanation += `Key positive factors include ${riskClassification.protectiveFactors.slice(0, 2).join(', ')}.`;
        break;

      case 'REVIEW':
        explanation = `This application requires additional review before a final decision can be made. `;
        explanation += `The applicant shows a ${riskLevel.toLowerCase()} risk profile with a credit score of ${creditScore}. `;
        explanation += `While some positive factors exist such as ${riskClassification.protectiveFactors[0] || 'limited financial history'}, `;
        explanation += `there are concerns including ${riskClassification.riskFactors[0] || 'moderate risk indicators'} that require manual assessment.`;
        break;

      case 'REJECTED':
        explanation = `After thorough analysis of financial behavior, transaction patterns, and risk indicators, `;
        explanation += `this application cannot be approved at this time. `;
        explanation += `The applicant demonstrates a ${riskLevel.toLowerCase()} risk profile with significant concerns including `;
        explanation += `${riskClassification.riskFactors.join(', ') || 'elevated risk factors'}. `;
        explanation += `We recommend addressing these issues and reapplying after demonstrating improved financial behavior.`;
        break;
    }

    return explanation;
  }

  /**
   * Generate detailed breakdown
   * @param {Object} behaviorScore - Behavior scoring data
   * @param {Object} transactionAnalysis - Transaction analysis data
   * @param {Object} savingsAnalysis - Savings analysis data
   * @returns {Object} Detailed breakdown
   */
  generateDetailedBreakdown(behaviorScore, transactionAnalysis, savingsAnalysis) {
    return {
      overallScore: {
        value: behaviorScore.overallScore,
        interpretation: this.interpretScore(behaviorScore.overallScore),
        contributingFactors: [
          `Transaction Consistency (${behaviorScore.componentScores.transactionConsistency}% weight: ${behaviorScore.breakdown.transactionConsistency.contribution} points)`,
          `Savings Discipline (${behaviorScore.componentScores.savingsDiscipline}% weight: ${behaviorScore.breakdown.savingsDiscipline.contribution} points)`,
          `Cashflow Stability (${behaviorScore.componentScores.cashflowStability}% weight: ${behaviorScore.breakdown.cashflowStability.contribution} points)`,
        ],
      },
      transactionPatterns: {
        stabilityScore: transactionAnalysis.transactionStabilityScore,
        incomeConsistencyScore: transactionAnalysis.incomeConsistencyScore,
        successRate: transactionAnalysis.successRate,
        totalTransactions: transactionAnalysis.totalTransactions,
        monthlyInflow: transactionAnalysis.averageMonthlyInflow,
        monthlyOutflow: transactionAnalysis.averageMonthlyOutflow,
      },
      savingsPatterns: {
        disciplineScore: savingsAnalysis.savingsDisciplineScore,
        profile: savingsAnalysis.savingsProfile,
        currentBalance: savingsAnalysis.currentBalance,
        netSavings: savingsAnalysis.netSavings,
        depositFrequency: savingsAnalysis.savingsFrequency,
      },
    };
  }

  /**
   * Generate recommendations
   * @param {Object} creditDecision - Credit decision data
   * @param {Object} riskClassification - Risk classification data
   * @param {Object} behaviorScore - Behavior scoring data
   * @returns {Object} Recommendations
   */
  generateRecommendations(creditDecision, riskClassification, behaviorScore) {
    const recommendations = [];

    // Always add general recommendation
    recommendations.push({
      category: 'General',
      text: 'Maintain consistent transaction patterns and ensure timely payments to improve creditworthiness over time.',
    });

    // Add score-specific recommendations
    if (behaviorScore.componentScores.transactionConsistency < 70) {
      recommendations.push({
        category: 'Transaction Improvement',
        text: 'Focus on maintaining a consistent transaction schedule with minimal failed or declined transactions.',
      });
    }

    if (behaviorScore.componentScores.savingsDiscipline < 70) {
      recommendations.push({
        category: 'Savings Improvement',
        text: 'Increase regular deposits to your savings account and reduce unnecessary withdrawals.',
      });
    }

    if (behaviorScore.componentScores.cashflowStability < 70) {
      recommendations.push({
        category: 'Cashflow Improvement',
        text: 'Work on achieving a positive inflow/outflow ratio by increasing income or reducing expenses.',
      });
    }

    // Add risk-specific recommendations
    if (riskClassification.riskLevel === 'HIGH') {
      recommendations.push({
        category: 'Risk Mitigation',
        text: 'Build an emergency fund covering at least 3 months of expenses before applying for credit.',
      });
    }

    // Add protective factor recommendations
    if (!riskClassification.protectiveFactors.includes('Extensive transaction history')) {
      recommendations.push({
        category: 'Credit Building',
        text: 'Build a longer transaction history by maintaining regular activity for at least 6 months.',
      });
    }

    return recommendations;
  }

  /**
   * Generate plain language summary
   * @param {Object} creditDecision - Credit decision data
   * @param {Object} riskClassification - Risk classification data
   * @param {Object} behaviorScore - Behavior scoring data
   * @param {Object} transactionAnalysis - Transaction analysis data
   * @param {Object} savingsAnalysis - Savings analysis data
   * @returns {string} Plain language summary
   */
  generatePlainLanguageSummary(creditDecision, riskClassification, behaviorScore, transactionAnalysis, savingsAnalysis) {
    const { decision, riskLevel } = creditDecision;

    let summary = '';

    if (decision === 'APPROVED') {
      summary = `Congratulations! Your loan application has been approved. `;
      summary += `We found that you manage your money well with `;
      if (riskClassification.protectiveFactors.length > 0) {
        summary += `${riskClassification.protectiveFactors[0].toLowerCase()}, `;
      }
      summary += `and maintain ${transactionAnalysis.successRate}% of your transactions successful. `;
      summary += `Your savings account shows ${savingsAnalysis.savingsProfile.toLowerCase()} behavior. `;
      summary += `We believe you can reliably repay the loan.`;
    } else if (decision === 'REVIEW') {
      summary = `Your loan application needs a closer look before we can make a final decision. `;
      summary += `While you demonstrate some good financial habits, there are a few areas we need to understand better. `;
      summary += `Please provide any additional documentation that can help us assess your repayment capability.`;
    } else {
      summary = `We're sorry, but we're unable to approve your loan application at this time. `;
      summary += `Our review found that your financial behavior shows some concerns that make lending risky for us. `;
      summary += `The main areas of concern are: ${riskClassification.riskFactors.slice(0, 2).join(' and ')}. `;
      summary += `We encourage you to work on these areas and reapply in the future.`;
    }

    return summary;
  }

  /**
   * Interpret a score
   * @param {number} score - Score value
   * @returns {string} Interpretation
   */
  interpretScore(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    if (score >= 30) return 'Poor';
    return 'Very Poor';
  }

  /**
   * Calculate confidence in the explanation
   * @param {Object} behaviorScore - Behavior scoring data
   * @param {Object} transactionAnalysis - Transaction analysis data
   * @returns {number} Confidence percentage
   */
  calculateConfidence(behaviorScore, transactionAnalysis) {
    let confidence = 50;

    // More transactions = more confidence
    if (transactionAnalysis.totalTransactions >= 50) {
      confidence += 30;
    } else if (transactionAnalysis.totalTransactions >= 20) {
      confidence += 20;
    } else if (transactionAnalysis.totalTransactions >= 10) {
      confidence += 10;
    }

    // Higher overall score = more confidence
    if (behaviorScore.overallScore >= 70) {
      confidence += 15;
    } else if (behaviorScore.overallScore < 40) {
      confidence -= 10;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Assess data quality for the analysis
   * @param {Object} transactionAnalysis - Transaction analysis data
   * @param {Object} savingsAnalysis - Savings analysis data
   * @returns {string} Data quality assessment
   */
  assessDataQuality(transactionAnalysis, savingsAnalysis) {
    const transactionCount = transactionAnalysis.totalTransactions || 0;
    const savingsRecords = (savingsAnalysis.depositCount || 0) + (savingsAnalysis.withdrawalCount || 0);

    if (transactionCount >= 50 && savingsRecords >= 20) {
      return 'EXCELLENT';
    }
    if (transactionCount >= 20 && savingsRecords >= 10) {
      return 'GOOD';
    }
    if (transactionCount >= 10 || savingsRecords >= 5) {
      return 'FAIR';
    }
    return 'LIMITED';
  }
}

module.exports = new ExplanationAgent();
