// LangGraph Workflows Index
//
// DEMO/REFERENCE PACKAGE — NOT WIRED AT RUNTIME.
//
// The API and MCP server do not use this package. Both call
// creditService.analyzeCreditworthiness() (@loan-risk-lens/application),
// which is the single runtime brain for credit intelligence.
//
// What lives here:
// - CreditIntelligenceWorkflow: 6-agent reference orchestration that
//   demonstrates the analysis steps end-to-end and returns per-agent
//   detailedAnalysis results (useful for tests/debugging)
//
// Single scoring formula guarantee:
// All scoring math lives in @loan-risk-lens/domain/scoring with weights
// from shared/config. BehaviorScoringAgent (here) and creditService
// (runtime) both delegate to that engine — neither owns scoring math.

const {
  CreditIntelligenceWorkflow,
  createCreditIntelligenceWorkflow,
} = require('./workflows/creditIntelligenceWorkflow');

module.exports = {
  CreditIntelligenceWorkflow,
  createCreditIntelligenceWorkflow,
};
