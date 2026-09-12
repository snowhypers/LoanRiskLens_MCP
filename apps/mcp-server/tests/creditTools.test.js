jest.mock('@loan-risk-lens/application/services/credit', () => ({
  analyzeCreditworthiness: jest.fn().mockResolvedValue({
    creditScore: 82,
    riskLevel: 'LOW',
    recommendedLoanAmount: 60000,
    repaymentConfidence: 'HIGH',
    decision: 'APPROVED',
    explanation: 'Strong savings discipline and stable cash flow.',
    details: {},
  }),
  analyzeFinancialBehavior: jest.fn().mockResolvedValue({
    behaviorProfile: 'Stable Saver',
    savingsScore: 85,
    cashflowStability: 'HIGH',
    withdrawalBehavior: 'NORMAL',
    details: {},
  }),
  generateUnderwritingReport: jest.fn().mockResolvedValue({
    userId: '550e8400-e29b-41d4-a716-446655440001',
    reportDate: '2026-07-06T00:00:00.000Z',
    creditScore: 82,
    riskLevel: 'LOW',
    recommendation: 'APPROVED',
    recommendedAmount: 60000,
    repaymentConfidence: 'HIGH',
    explanation: 'Approved.',
    financialBehavior: {
      profile: 'Stable Saver',
      savingsScore: 85,
      cashflowStability: 'HIGH',
      withdrawalBehavior: 'NORMAL',
    },
    riskFactors: [],
    protectiveFactors: ['Strong savings discipline'],
    scoreBreakdown: {
      overall: 82,
      transactionConsistency: 80,
      savingsDiscipline: 85,
      cashflowStability: 82,
    },
    savedReportId: 'report-1',
  }),
}));

const { executeTool } = require('../src/tools/creditTools');

describe('MCP credit tools', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440001';

  it('returns snake_case creditworthiness fields', async () => {
    const result = await executeTool('analyze_creditworthiness', { user_id: userId });

    expect(result).toHaveProperty('credit_score', 82);
    expect(result).toHaveProperty('risk_level', 'LOW');
    expect(result).toHaveProperty('recommended_loan_amount', 60000);
    expect(result).not.toHaveProperty('creditScore');
  });

  it('returns snake_case underwriting report fields', async () => {
    const result = await executeTool('generate_underwriting_report', { user_id: userId });

    expect(result).toHaveProperty('user_id', userId);
    expect(result).toHaveProperty('report_date');
    expect(result.score_breakdown).toHaveProperty('transaction_consistency', 80);
  });

  it('rejects invalid UUID input', async () => {
    await expect(
      executeTool('analyze_creditworthiness', { user_id: 'not-a-uuid' })
    ).rejects.toThrow('Invalid or missing user_id');
  });
});
