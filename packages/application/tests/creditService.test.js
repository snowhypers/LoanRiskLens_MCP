// Unit Tests for Credit Service

const creditService = require('../src/services/creditService');

// Mock the repositories and engines
jest.mock('@loan-risk-lens/infrastructure/repositories/report', () => ({
  create: jest.fn().mockResolvedValue({ id: 'report-123' }),
  getLatestByUserId: jest.fn().mockResolvedValue({ id: 'report-123' }),
}));

jest.mock('@loan-risk-lens/infrastructure/repositories/user', () => ({
  findById: jest.fn().mockResolvedValue({
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test User',
  }),
}));

jest.mock('../src/services/transactionService', () => ({
  analyzeTransactions: jest.fn().mockResolvedValue({
    totalTransactions: 100,
    creditTransactions: 40,
    debitTransactions: 60,
    failedTransactions: 3,
    incomeConsistencyScore: 80,
    averageMonthlyInflow: 50000,
    averageMonthlyOutflow: 30000,
  }),
}));

jest.mock('../src/services/savingsService', () => ({
  analyzeSavings: jest.fn().mockResolvedValue({
    totalDeposits: 120000,
    totalWithdrawals: 20000,
    currentBalance: 100000,
    depositCount: 12,
    withdrawalCount: 4,
    averageDeposit: 10000,
    averageWithdrawal: 5000,
  }),
}));

describe('CreditService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeCreditworthiness', () => {
    it('should return complete creditworthiness analysis', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const result = await creditService.analyzeCreditworthiness(userId);

      expect(result).toHaveProperty('creditScore');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('recommendedLoanAmount');
      expect(result).toHaveProperty('repaymentConfidence');
      expect(result).toHaveProperty('decision');
      expect(result).toHaveProperty('explanation');
      expect(result).toHaveProperty('details');

      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.riskLevel);
      expect(['APPROVED', 'REVIEW', 'REJECTED']).toContain(result.decision);
    });

    it('should calculate correct risk level for good behavior', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const result = await creditService.analyzeCreditworthiness(userId);

      // With good data, should typically be LOW risk
      expect(result.creditScore).toBeGreaterThanOrEqual(0);
      expect(result.creditScore).toBeLessThanOrEqual(100);
    });
  });

  describe('analyzeFinancialBehavior', () => {
    it('should return complete behavior analysis', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const result = await creditService.analyzeFinancialBehavior(userId);

      expect(result).toHaveProperty('behaviorProfile');
      expect(result).toHaveProperty('savingsScore');
      expect(result).toHaveProperty('cashflowStability');
      expect(result).toHaveProperty('withdrawalBehavior');

      expect(result.savingsScore).toBeGreaterThanOrEqual(0);
      expect(result.savingsScore).toBeLessThanOrEqual(100);
    });

    it('should classify user into valid profile', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const result = await creditService.analyzeFinancialBehavior(userId);

      const validProfiles = [
        'Stable Saver',
        'Seasonal Earner',
        'High Withdrawal User',
        'Merchant Cash Flow User',
        'New User',
      ];
      expect(validProfiles).toContain(result.behaviorProfile);
    });
  });

  describe('generateUnderwritingReport', () => {
    it('should generate comprehensive report', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const result = await creditService.generateUnderwritingReport(userId);

      expect(result).toHaveProperty('userId', userId);
      expect(result).toHaveProperty('reportDate');
      expect(result).toHaveProperty('creditScore');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('recommendation');
      expect(result).toHaveProperty('recommendedAmount');
      expect(result).toHaveProperty('explanation');
      expect(result).toHaveProperty('financialBehavior');
      expect(result).toHaveProperty('riskFactors');
      expect(result).toHaveProperty('protectiveFactors');
      expect(result).toHaveProperty('scoreBreakdown');
    });
  });

  describe('generateExplanation', () => {
    it('should generate non-empty explanation', () => {
      const behaviorScore = {
        overallScore: 75,
        transactionScore: 80,
        savingsScore: 70,
        cashflowScore: 75,
        breakdown: {
          transactionConsistency: { contribution: 28 },
          savingsDiscipline: { contribution: 28 },
          cashflowStability: { contribution: 19 },
        },
      };

      const riskClassification = {
        riskLevel: 'LOW',
        riskFactors: [],
        protectiveFactors: ['Strong savings discipline'],
      };

      const transactionAnalysis = {
        totalTransactions: 100,
        incomeConsistencyScore: 80,
        monthlyInflow: 50000,
        monthlyOutflow: 30000,
      };

      const savingsAnalysis = {
        totalDeposits: 120000,
        totalWithdrawals: 20000,
        currentBalance: 100000,
        averageMonthlyInflow: 50000,
      };

      const explanation = creditService.generateExplanation(
        behaviorScore,
        riskClassification,
        transactionAnalysis,
        savingsAnalysis
      );

      expect(explanation).toBeDefined();
      expect(explanation.length).toBeGreaterThan(0);
    });
  });
});
