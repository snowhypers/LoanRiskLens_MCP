// Credit Intelligence Workflow - Demo/reference LangGraph orchestration
//
// DEMO STATUS — NOT WIRED AT RUNTIME.
//
// The API and MCP server do not call this workflow. Both use
// creditService.analyzeCreditworthiness() (@loan-risk-lens/application),
// which is the single runtime brain for credit intelligence.
//
// What this file IS for:
// - A readable reference for the credit analysis steps, end-to-end
// - Per-agent detailedAnalysis results (tests/debugging)
// - Pinned by tests/creditIntelligenceWorkflow.test.js (5 scenarios)
//
// Single scoring formula guarantee:
// This workflow owns NO scoring math. Every step delegates to the shared
// domain engine (@loan-risk-lens/domain/scoring, weights from
// shared/config) — the same engine creditService calls directly. Changing
// a weight there updates this demo and production simultaneously.

const transactionAnalysisAgent = require('../agents/transactionAnalysisAgent');
const savingsAnalysisAgent = require('../agents/savingsAnalysisAgent');
const behaviorScoringAgent = require('../agents/behaviorScoringAgent');
const riskClassificationAgent = require('../agents/riskClassificationAgent');
const creditDecisionAgent = require('../agents/creditDecisionAgent');
const explanationAgent = require('../agents/explanationAgent');
const logger = require('shared/utils/logger');

/**
 * Credit Intelligence Workflow
 *
 * LangGraph workflow for comprehensive creditworthiness analysis.
 *
 * Workflow Flow:
 * START → Transaction Analysis Agent → Savings Analysis Agent
 *       → Behavior Scoring Agent → Risk Classification Agent
 *       → Credit Decision Agent → Explanation Agent → END
 */

class CreditIntelligenceWorkflow {
  constructor() {
    this.name = 'CreditIntelligenceWorkflow';
    this.version = '1.0.0';
    this.agents = {
      transactionAnalysis: transactionAnalysisAgent,
      savingsAnalysis: savingsAnalysisAgent,
      behaviorScoring: behaviorScoringAgent,
      riskClassification: riskClassificationAgent,
      creditDecision: creditDecisionAgent,
      explanation: explanationAgent,
    };
  }

  /**
   * Execute the complete credit intelligence workflow
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Complete workflow result
   */
  async execute(userId) {
    logger.info('CreditIntelligenceWorkflow: Starting workflow', { userId });

    const startTime = Date.now();
    const workflowState = {
      userId,
      startTime,
      steps: [],
      results: {},
      errors: [],
    };

    try {
      // Step 1: Transaction Analysis
      logger.info('Step 1/6: Transaction Analysis');
      const transactionAnalysis = await this.executeAgent(
        'transactionAnalysis',
        userId,
        workflowState
      );
      workflowState.results.transactionAnalysis = transactionAnalysis;

      // Step 2: Savings Analysis
      logger.info('Step 2/6: Savings Analysis');
      const savingsAnalysis = await this.executeAgent(
        'savingsAnalysis',
        userId,
        workflowState
      );
      workflowState.results.savingsAnalysis = savingsAnalysis;

      // Step 3: Behavior Scoring
      logger.info('Step 3/6: Behavior Scoring');
      const behaviorScore = this.executeAgent(
        'behaviorScoring',
        transactionAnalysis,
        savingsAnalysis,
        workflowState
      );
      workflowState.results.behaviorScore = behaviorScore;

      // Step 4: Risk Classification
      logger.info('Step 4/6: Risk Classification');
      const riskClassification = this.executeAgent(
        'riskClassification',
        behaviorScore,
        transactionAnalysis,
        savingsAnalysis,
        workflowState
      );
      workflowState.results.riskClassification = riskClassification;

      // Step 5: Credit Decision
      logger.info('Step 5/6: Credit Decision');
      const creditDecision = this.executeAgent(
        'creditDecision',
        riskClassification,
        behaviorScore,
        transactionAnalysis,
        savingsAnalysis,
        workflowState
      );
      workflowState.results.creditDecision = creditDecision;

      // Step 6: Explanation Generation
      logger.info('Step 6/6: Explanation Generation');
      const explanation = this.executeAgent(
        'explanation',
        creditDecision,
        riskClassification,
        behaviorScore,
        transactionAnalysis,
        savingsAnalysis,
        workflowState
      );
      workflowState.results.explanation = explanation;

      // Calculate total execution time
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Generate final result
      const result = this.generateFinalResult(workflowState, totalTime);

      logger.info('CreditIntelligenceWorkflow: Workflow complete', {
        userId,
        totalTime,
        decision: creditDecision.decision,
        riskLevel: creditDecision.riskLevel,
      });

      return result;
    } catch (error) {
      logger.error('CreditIntelligenceWorkflow: Workflow failed', {
        userId,
        error: error.message,
      });
      workflowState.errors.push({
        step: 'workflow',
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Execute a single agent
   * @param {string} agentName - Name of the agent
   * @param {...any} args - Agent arguments
   * @returns {any} Agent result
   */
  executeAgent(agentName, ...args) {
    const agent = this.agents[agentName];
    if (!agent) {
      throw new Error(`Unknown agent: ${agentName}`);
    }
    return agent.execute(...args);
  }

  /**
   * Generate final result from workflow state
   * @param {Object} workflowState - Workflow state
   * @param {number} totalTime - Total execution time in ms
   * @returns {Object} Final result
   */
  generateFinalResult(workflowState, totalTime) {
    const { userId, results, errors } = workflowState;

    return {
      workflow: {
        name: this.name,
        version: this.version,
        executionTime: totalTime,
        completedAt: new Date().toISOString(),
      },
      userId,
      decision: results.creditDecision.decision,
      creditScore: results.creditDecision.creditScore,
      riskLevel: results.creditDecision.riskLevel,
      recommendedAmount: results.creditDecision.recommendedAmount,
      repaymentConfidence: results.creditDecision.repaymentConfidence,
      explanation: results.explanation.mainExplanation,
      plainLanguageSummary: results.explanation.plainLanguageSummary,
      recommendations: results.explanation.recommendations,
      detailedAnalysis: {
        transactionAnalysis: results.transactionAnalysis,
        savingsAnalysis: results.savingsAnalysis,
        behaviorScore: results.behaviorScore,
        riskClassification: results.riskClassification,
        creditDecision: results.creditDecision,
      },
      metadata: {
        dataQuality: results.explanation.metadata.dataQuality,
        confidence: results.explanation.metadata.confidence,
      },
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Get workflow status
   * @param {string} userId - User UUID
   * @returns {Object} Workflow status
   */
  getStatus(userId) {
    return {
      workflow: this.name,
      status: 'idle',
      userId,
      availableAgents: Object.keys(this.agents),
    };
  }
}

// Factory function for creating workflow instance
function createCreditIntelligenceWorkflow() {
  return new CreditIntelligenceWorkflow();
}

// Export for module use
module.exports = {
  CreditIntelligenceWorkflow,
  createCreditIntelligenceWorkflow,
};

// Run standalone test
if (require.main === module) {
  const workflow = createCreditIntelligenceWorkflow();
  console.log('Credit Intelligence Workflow initialized');
  console.log('Available agents:', Object.keys(workflow.agents));
}
