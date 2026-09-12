// Unit Tests for Analysis Engine

const {
  analyzeSavingsProfile,
  analyzeTransactionPatterns,
  classifyRisk,
  analyzeWithdrawalBehavior,
} = require('../src/analysis');

describe('Analysis Engine', () => {
  describe('analyzeSavingsProfile', () => {
    it('should classify as Stable Saver for excellent savings habits', () => {
      const savingsData = {
        totalDeposits: 100000,
        totalWithdrawals: 15000,
        depositCount: 12,
        withdrawalCount: 3,
        averageDeposit: 8333,
        averageWithdrawal: 5000,
      };
      const result = analyzeSavingsProfile(savingsData);
      expect(result.profile).toBe('Stable Saver');
      expect(result.profileScore).toBeGreaterThan(70);
    });

    it('should classify as Merchant Cash Flow User when deposit/withdrawal ratio is near 1', () => {
      const savingsData = {
        totalDeposits: 50000,
        totalWithdrawals: 45000,
        depositCount: 6,
        withdrawalCount: 15,
        averageDeposit: 8333,
        averageWithdrawal: 3000,
      };
      const result = analyzeSavingsProfile(savingsData);
      // depositWithdrawalRatio = 45000/50000 = 0.9, within 0.3 of 1
      expect(result.profile).toBe('Merchant Cash Flow User');
    });

    it('should classify as Seasonal Earner for infrequent large deposits', () => {
      const savingsData = {
        totalDeposits: 15000,
        totalWithdrawals: 3000,
        depositCount: 2,
        withdrawalCount: 2,
        averageDeposit: 7500,
        averageWithdrawal: 1500,
      };
      const result = analyzeSavingsProfile(savingsData);
      expect(result.profile).toBe('Seasonal Earner');
    });

    it('should classify as High Withdrawal User when avgWithdrawal > avgDeposit * 0.8', () => {
      const savingsData = {
        totalDeposits: 100000,
        totalWithdrawals: 90000,
        depositCount: 20,
        withdrawalCount: 18,
        averageDeposit: 5000,
        averageWithdrawal: 5000,
      };
      const result = analyzeSavingsProfile(savingsData);
      // avgWithdrawal (5000) > avgDeposit (5000) * 0.8 = 4000
      expect(result.profile).toBe('High Withdrawal User');
    });
  });

  describe('analyzeTransactionPatterns', () => {
    it('should analyze transaction patterns correctly', () => {
      const transactionData = {
        totalTransactions: 100,
        creditTransactions: 40,
        debitTransactions: 60,
        failedTransactions: 5,
        monthlyInflow: 50000,
        monthlyOutflow: 35000,
        transactionsByDayOfWeek: {},
        transactionsByHour: {},
      };
      const result = analyzeTransactionPatterns(transactionData);

      expect(result).toHaveProperty('totalTransactions', 100);
      expect(result).toHaveProperty('successRate');
      expect(result).toHaveProperty('incomeConsistencyScore');
      expect(result).toHaveProperty('cashFlowHealth', 'BALANCED');
    });

    it('should detect deficit cash flow', () => {
      const transactionData = {
        totalTransactions: 50,
        creditTransactions: 20,
        debitTransactions: 30,
        failedTransactions: 2,
        monthlyInflow: 20000,
        monthlyOutflow: 35000,
        transactionsByDayOfWeek: {},
        transactionsByHour: {},
      };
      const result = analyzeTransactionPatterns(transactionData);
      expect(result.cashFlowHealth).toBe('DEFICIT');
    });
  });

  describe('classifyRisk', () => {
    it('should classify as LOW for excellent scores', () => {
      const scores = {
        creditScore: 85,
        transactionScore: 80,
        savingsScore: 85,
        cashflowScore: 80,
      };
      const result = classifyRisk(scores);
      expect(result.riskLevel).toBe('LOW');
      expect(result.protectiveFactors.length).toBeGreaterThan(0);
    });

    it('should classify as HIGH for poor scores', () => {
      const scores = {
        creditScore: 30,
        transactionScore: 35,
        savingsScore: 30,
        cashflowScore: 40,
      };
      const result = classifyRisk(scores);
      expect(result.riskLevel).toBe('HIGH');
      expect(result.riskFactors.length).toBeGreaterThan(0);
    });

    it('should identify risk and protective factors', () => {
      const scores = {
        creditScore: 55,
        transactionScore: 40,
        savingsScore: 60,
        cashflowScore: 70,
      };
      const result = classifyRisk(scores);

      expect(result).toHaveProperty('riskFactors');
      expect(result).toHaveProperty('protectiveFactors');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('scoreBreakdown');
    });
  });

  describe('analyzeWithdrawalBehavior', () => {
    it('should classify normal withdrawal behavior', () => {
      const savingsData = {
        totalWithdrawals: 10000,
        withdrawalCount: 5,
        averageWithdrawal: 2000,
        largestWithdrawal: 3000,
      };
      const result = analyzeWithdrawalBehavior(savingsData);
      expect(result.behavior).toBe('NORMAL');
    });

    it('should classify high-value withdrawals', () => {
      const savingsData = {
        totalWithdrawals: 100000,
        withdrawalCount: 3,
        averageWithdrawal: 33333,
        largestWithdrawal: 50000,
      };
      const result = analyzeWithdrawalBehavior(savingsData);
      expect(result.behavior).toBe('HIGH_VALUE_WITHDRAWALS');
    });

    it('should classify frequent withdrawals', () => {
      const savingsData = {
        totalWithdrawals: 50000,
        withdrawalCount: 25,
        averageWithdrawal: 2000,
        largestWithdrawal: 5000,
      };
      const result = analyzeWithdrawalBehavior(savingsData);
      expect(result.behavior).toBe('FREQUENT_WITHDRAWALS');
    });
  });
});
