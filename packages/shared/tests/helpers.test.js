// Unit Tests for Helper Functions

const {
  calculateWeightedScore,
  classifyRiskLevel,
  calculateRecommendedLoanAmount,
  formatCurrency,
  calculateRepaymentConfidence,
  generateCreditDecision,
  getDateRange,
  createAuditEntry,
} = require('../src/utils/helpers');

describe('Helper Functions', () => {
  describe('calculateWeightedScore', () => {
    it('should calculate weighted average correctly', () => {
      const scores = {
        transactionConsistency: 80,
        savingsDiscipline: 70,
        cashflowStability: 60,
      };
      const weights = {
        transactionConsistency: 0.35,
        savingsDiscipline: 0.40,
        cashflowStability: 0.25,
      };
      const result = calculateWeightedScore(scores, weights);
      // Expected: 80*0.35 + 70*0.40 + 60*0.25 = 28 + 28 + 15 = 71
      expect(result).toBe(71);
    });

    it('should handle missing weights', () => {
      const scores = {
        transactionConsistency: 80,
        savingsDiscipline: 70,
      };
      const weights = {
        transactionConsistency: 0.5,
        savingsDiscipline: 0.5,
      };
      const result = calculateWeightedScore(scores, weights);
      expect(result).toBe(75);
    });

    it('should return 0 when no weights match', () => {
      const scores = { a: 80, b: 70 };
      const weights = { c: 0.5, d: 0.5 };
      const result = calculateWeightedScore(scores, weights);
      expect(result).toBe(0);
    });
  });

  describe('classifyRiskLevel', () => {
    it('should classify LOW for high scores', () => {
      const thresholds = { low: 70, medium: 40, high: 0 };
      expect(classifyRiskLevel(80, thresholds)).toBe('LOW');
      expect(classifyRiskLevel(70, thresholds)).toBe('LOW');
    });

    it('should classify MEDIUM for medium scores', () => {
      const thresholds = { low: 70, medium: 40, high: 0 };
      expect(classifyRiskLevel(60, thresholds)).toBe('MEDIUM');
      expect(classifyRiskLevel(40, thresholds)).toBe('MEDIUM');
    });

    it('should classify HIGH for low scores', () => {
      const thresholds = { low: 70, medium: 40, high: 0 };
      expect(classifyRiskLevel(30, thresholds)).toBe('HIGH');
      expect(classifyRiskLevel(0, thresholds)).toBe('HIGH');
    });
  });

  describe('calculateRecommendedLoanAmount', () => {
    it('should calculate higher amounts for better scores', () => {
      const loanConfig = { minAmount: 1000, maxAmount: 500000, defaultAmount: 10000 };

      const lowScore = calculateRecommendedLoanAmount(30, 'HIGH', loanConfig);
      const mediumScore = calculateRecommendedLoanAmount(50, 'MEDIUM', loanConfig);
      const highScore = calculateRecommendedLoanAmount(80, 'LOW', loanConfig);

      expect(highScore).toBeGreaterThan(mediumScore);
      expect(mediumScore).toBeGreaterThan(lowScore);
    });

    it('should respect min and max bounds', () => {
      const loanConfig = { minAmount: 1000, maxAmount: 500000, defaultAmount: 10000 };

      const veryLow = calculateRecommendedLoanAmount(5, 'HIGH', loanConfig);
      const veryHigh = calculateRecommendedLoanAmount(95, 'LOW', loanConfig);

      expect(veryLow).toBeGreaterThanOrEqual(loanConfig.minAmount);
      expect(veryHigh).toBeLessThanOrEqual(loanConfig.maxAmount);
    });
  });

  describe('formatCurrency', () => {
    it('should format INR currency correctly', () => {
      const result = formatCurrency(50000, 'INR');
      expect(result).toContain('50,000');
    });

    it('should handle zero', () => {
      const result = formatCurrency(0, 'INR');
      expect(result).toContain('0');
    });
  });

  describe('calculateRepaymentConfidence', () => {
    it('should return HIGH for LOW risk with good score', () => {
      expect(calculateRepaymentConfidence(75, 'LOW')).toBe('HIGH');
    });

    it('should return MEDIUM for MEDIUM risk with sufficient score', () => {
      expect(calculateRepaymentConfidence(55, 'MEDIUM')).toBe('MEDIUM');
    });

    it('should return LOW for HIGH risk', () => {
      expect(calculateRepaymentConfidence(40, 'HIGH')).toBe('LOW');
    });
  });

  describe('generateCreditDecision', () => {
    it('should APPROVE for LOW risk with good score', () => {
      expect(generateCreditDecision(70, 'LOW')).toBe('APPROVED');
    });

    it('should REVIEW for MEDIUM risk with sufficient score', () => {
      expect(generateCreditDecision(50, 'MEDIUM')).toBe('REVIEW');
    });

    it('should REJECT for HIGH risk', () => {
      expect(generateCreditDecision(30, 'HIGH')).toBe('REJECTED');
    });
  });

  describe('getDateRange', () => {
    it('should return correct date range', () => {
      const result = getDateRange(6);
      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
    });

    it('should default to 6 months', () => {
      const result = getDateRange();
      const monthsDiff = (result.endDate - result.startDate) / (1000 * 60 * 60 * 24 * 30);
      expect(monthsDiff).toBeCloseTo(6, 0);
    });
  });

  describe('createAuditEntry', () => {
    it('should create valid audit entry', () => {
      const data = {
        userId: 'user-123',
        action: 'CREATE',
        resource: 'user',
        details: { field: 'value' },
        ipAddress: '127.0.0.1',
      };
      const result = createAuditEntry(data);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('userId', 'user-123');
      expect(result).toHaveProperty('action', 'CREATE');
      expect(result).toHaveProperty('createdAt');
    });
  });
});
