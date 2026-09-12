jest.mock('@loan-risk-lens/application/services/transaction', () => ({
  analyzeTransactions: jest.fn(),
}));

jest.mock('@loan-risk-lens/application/services/savings', () => ({
  analyzeSavings: jest.fn(),
}));

const { createCreditIntelligenceWorkflow } = require('../src/workflows/creditIntelligenceWorkflow');
const transactionService = require('@loan-risk-lens/application/services/transaction');
const savingsService = require('@loan-risk-lens/application/services/savings');

function incomeConsistency(scenario) {
  return Math.max(
    20,
    Math.min(100, Math.round(100 - ((scenario.failedTransactions / scenario.totalTransactions) * 200)))
  );
}

function mockScenario(scenario) {
  const averageMonthlyOutflow = Math.max(0, scenario.monthlyIncome - (scenario.balance / 6));

  transactionService.analyzeTransactions.mockResolvedValue({
    totalTransactions: scenario.totalTransactions,
    creditTransactions: scenario.creditTransactions,
    debitTransactions: scenario.debitTransactions,
    failedTransactions: scenario.failedTransactions,
    incomeConsistencyScore: incomeConsistency(scenario),
    averageMonthlyInflow: scenario.monthlyIncome,
    averageMonthlyOutflow,
    monthlyAggregates: [],
  });

  savingsService.analyzeSavings.mockResolvedValue({
    totalDeposits: scenario.totalDeposits,
    totalWithdrawals: scenario.totalWithdrawals,
    netSavings: scenario.totalDeposits - scenario.totalWithdrawals,
    currentBalance: scenario.balance,
    depositCount: scenario.creditTransactions,
    withdrawalCount: scenario.debitTransactions,
    averageDeposit: scenario.totalDeposits / scenario.creditTransactions,
    averageWithdrawal: scenario.totalWithdrawals / scenario.debitTransactions,
    savingsFrequency: scenario.creditTransactions / 6,
    trend: [],
  });
}

describe('CreditIntelligenceWorkflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const scenarios = [
    {
      name: 'Rajesh Kumar',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      monthlyIncome: 45000,
      totalTransactions: 48,
      creditTransactions: 29,
      debitTransactions: 19,
      failedTransactions: 1,
      totalDeposits: 85000,
      totalWithdrawals: 18000,
      balance: 67000,
      expectedRisk: 'LOW',
      expectedDecision: 'APPROVED',
    },
    {
      name: 'Amit Singh',
      userId: '550e8400-e29b-41d4-a716-446655440002',
      monthlyIncome: 32000,
      totalTransactions: 36,
      creditTransactions: 20,
      debitTransactions: 16,
      failedTransactions: 3,
      totalDeposits: 42000,
      totalWithdrawals: 27000,
      balance: 15000,
      expectedRisk: 'MEDIUM',
      expectedDecision: 'REVIEW',
    },
    {
      name: 'Pooja Devi',
      userId: '550e8400-e29b-41d4-a716-446655440003',
      monthlyIncome: 28000,
      totalTransactions: 28,
      creditTransactions: 16,
      debitTransactions: 12,
      failedTransactions: 4,
      totalDeposits: 35000,
      totalWithdrawals: 30000,
      balance: 5000,
      expectedRisk: 'MEDIUM',
      expectedDecision: 'REVIEW',
    },
    {
      name: 'Ravi Sharma',
      userId: '550e8400-e29b-41d4-a716-446655440004',
      monthlyIncome: 39000,
      totalTransactions: 31,
      creditTransactions: 15,
      debitTransactions: 16,
      failedTransactions: 8,
      totalDeposits: 28000,
      totalWithdrawals: 34000,
      balance: -6000,
      expectedRisk: 'HIGH',
      expectedDecision: 'REJECTED',
    },
    {
      name: 'Sanjay Gupta',
      userId: '550e8400-e29b-41d4-a716-446655440005',
      monthlyIncome: 26000,
      totalTransactions: 41,
      creditTransactions: 26,
      debitTransactions: 15,
      failedTransactions: 0,
      totalDeposits: 62000,
      totalWithdrawals: 21000,
      balance: 41000,
      expectedRisk: 'LOW',
      expectedDecision: 'APPROVED',
    },
  ];

  it.each(scenarios)('executes all agents correctly for $name', async (scenario) => {
    mockScenario(scenario);

    const workflow = createCreditIntelligenceWorkflow();
    const result = await workflow.execute(scenario.userId);

    expect(result.decision).toBe(scenario.expectedDecision);
    expect(result.riskLevel).toBe(scenario.expectedRisk);
    expect(result.detailedAnalysis.transactionAnalysis.agent).toBe('TransactionAnalysisAgent');
    expect(result.detailedAnalysis.savingsAnalysis.agent).toBe('SavingsAnalysisAgent');
    expect(result.detailedAnalysis.behaviorScore.agent).toBe('BehaviorScoringAgent');
    expect(result.detailedAnalysis.riskClassification.agent).toBe('RiskClassificationAgent');
    expect(result.detailedAnalysis.creditDecision.agent).toBe('CreditDecisionAgent');
    expect(result.detailedAnalysis.behaviorScore.creditScore).toBe(result.creditScore);
    expect(result.explanation.length).toBeGreaterThan(20);
  });
});
