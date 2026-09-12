// Unit Tests for Credit Scoring Engine

const {
  calculateTransactionConsistencyScore,
  calculateSavingsDisciplineScore,
  calculateCashflowStabilityScore,
  calculateOverallBehaviorScore,
  calculateCreditScore,
} = require('../src/scoring');

describe('Credit Scoring Engine', () => {
  describe('calculateTransactionConsistencyScore', () => {
    it('should calculate high score for consistent transactions with low failure rate', () => {
      const input = {
        totalTransactions: 100,
        failedTransactions: 2,
        incomeConsistencyScore: 85,
        averageMonthlyInflow: 50000,
        averageMonthlyOutflow: 30000,
      };
      const score = calculateTransactionConsistencyScore(input);
      expect(score).toBeGreaterThan(70);
    });

    it('should calculate low score for inconsistent transactions with high failure rate', () => {
      const input = {
        totalTransactions: 20,
        failedTransactions: 10,
        incomeConsistencyScore: 30,
        averageMonthlyInflow: 10000,
        averageMonthlyOutflow: 40000,
      };
      const score = calculateTransactionConsistencyScore(input);
      expect(score).toBeLessThan(50);
    });

    it('should handle zero transactions', () => {
      const input = {
        totalTransactions: 0,
        failedTransactions: 0,
        incomeConsistencyScore: 50,
        averageMonthlyInflow: 0,
        averageMonthlyOutflow: 0,
      };
      const score = calculateTransactionConsistencyScore(input);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateSavingsDisciplineScore', () => {
    it('should calculate high score for excellent savings discipline', () => {
      const input = {
        totalDeposits: 100000,
        totalWithdrawals: 20000,
        savingsFrequency: 8,
        averageDepositAmount: 12500,
        averageWithdrawalAmount: 2500,
      };
      const score = calculateSavingsDisciplineScore(input);
      expect(score).toBeGreaterThan(75);
    });

    it('should calculate low score for poor savings discipline', () => {
      const input = {
        totalDeposits: 30000,
        totalWithdrawals: 25000,
        savingsFrequency: 2,
        averageDepositAmount: 3000,
        averageWithdrawalAmount: 2500,
      };
      const score = calculateSavingsDisciplineScore(input);
      expect(score).toBeLessThan(60);
    });
  });

  describe('calculateCashflowStabilityScore', () => {
    it('should calculate high score for stable cashflow', () => {
      const transactionInput = {
        incomeConsistencyScore: 85,
        averageMonthlyInflow: 50000,
      };
      const savingsInput = {
        currentBalance: 150000,
        averageDeposit: 50000,
      };
      const score = calculateCashflowStabilityScore(transactionInput, savingsInput);
      expect(score).toBeGreaterThan(70);
    });

    it('should calculate moderate score for average cashflow', () => {
      const transactionInput = {
        incomeConsistencyScore: 60,
        averageMonthlyInflow: 30000,
      };
      const savingsInput = {
        currentBalance: 30000,
        averageDeposit: 30000,
      };
      const score = calculateCashflowStabilityScore(transactionInput, savingsInput);
      expect(score).toBeGreaterThan(40);
    });
  });

  describe('calculateOverallBehaviorScore', () => {
    it('should calculate weighted overall score', () => {
      const transactionAnalysis = {
        totalTransactions: 100,
        failedTransactions: 5,
        incomeConsistencyScore: 80,
        averageMonthlyInflow: 50000,
        averageMonthlyOutflow: 30000,
      };
      const savingsAnalysis = {
        totalDeposits: 100000,
        totalWithdrawals: 20000,
        savingsFrequency: 6,
        averageDepositAmount: 16666,
        averageWithdrawalAmount: 3333,
        currentBalance: 80000,
        averageMonthlyInflow: 50000,
      };

      const result = calculateOverallBehaviorScore(transactionAnalysis, savingsAnalysis);

      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('transactionScore');
      expect(result).toHaveProperty('savingsScore');
      expect(result).toHaveProperty('cashflowScore');
      expect(result).toHaveProperty('breakdown');
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateCreditScore', () => {
    it('should apply bonuses for excellent patterns', () => {
      const transactionAnalysis = {
        totalTransactions: 100,
        failedTransactions: 2,
        incomeConsistencyScore: 85,
        averageMonthlyInflow: 50000,
        averageMonthlyOutflow: 30000,
      };
      const savingsAnalysis = {
        totalDeposits: 100000,
        totalWithdrawals: 10000,
        savingsFrequency: 8,
        averageDepositAmount: 12500,
        averageWithdrawalAmount: 1250,
        currentBalance: 90000,
        averageMonthlyInflow: 50000,
      };
      const behavioralScore = {
        overallScore: 75,
        transactionScore: 80,
        savingsScore: 85,
        cashflowScore: 70,
      };

      const score = calculateCreditScore(transactionAnalysis, savingsAnalysis, behavioralScore);
      expect(score).toBeGreaterThanOrEqual(75);
    });

    it('should apply penalties for risky patterns', () => {
      const transactionAnalysis = {
        totalTransactions: 5,
        failedTransactions: 1,
        incomeConsistencyScore: 40,
        averageMonthlyInflow: 10000,
        averageMonthlyOutflow: 8000,
      };
      const savingsAnalysis = {
        totalDeposits: 5000,
        totalWithdrawals: 4500,
        savingsFrequency: 1,
        averageDepositAmount: 1000,
        averageWithdrawalAmount: 900,
        currentBalance: 500,
        averageMonthlyInflow: 10000,
      };
      const behavioralScore = {
        overallScore: 45,
        transactionScore: 50,
        savingsScore: 45,
        cashflowScore: 40,
      };

      const score = calculateCreditScore(transactionAnalysis, savingsAnalysis, behavioralScore);
      expect(score).toBeLessThan(45);
    });
  });
});
