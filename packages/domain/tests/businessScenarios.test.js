const scoring = require('../src/scoring');
const analysis = require('../src/analysis');
const helpers = require('shared/utils/helpers');

const loanConfig = {
  minAmount: 1000,
  maxAmount: 500000,
  defaultAmount: 10000,
};

function incomeConsistency({ failedTransactions, totalTransactions }) {
  if (!totalTransactions) return 50;
  return Math.max(20, Math.min(100, Math.round(100 - ((failedTransactions / totalTransactions) * 200))));
}

function evaluateScenario(scenario) {
  const monthlyNet = scenario.balance / 6;
  const averageMonthlyOutflow = Math.max(0, scenario.monthlyIncome - monthlyNet);
  const transactionAnalysis = {
    totalTransactions: scenario.totalTransactions,
    failedTransactions: scenario.failedTransactions,
    averageMonthlyInflow: scenario.monthlyIncome,
    averageMonthlyOutflow,
    incomeConsistencyScore: incomeConsistency(scenario),
  };
  const savingsAnalysis = {
    totalDeposits: scenario.totalDeposits,
    totalWithdrawals: scenario.totalWithdrawals,
    currentBalance: scenario.balance,
    averageDeposit: scenario.totalDeposits / scenario.creditTransactions,
    averageWithdrawal: scenario.totalWithdrawals / scenario.debitTransactions,
    savingsFrequency: scenario.creditTransactions / 6,
  };

  const behaviorScore = scoring.calculateOverallBehaviorScore(transactionAnalysis, savingsAnalysis);
  const creditScore = scoring.calculateCreditScore(transactionAnalysis, savingsAnalysis, behaviorScore);
  const riskClassification = analysis.classifyRisk({
    creditScore,
    transactionScore: behaviorScore.transactionScore,
    savingsScore: behaviorScore.savingsScore,
    cashflowScore: behaviorScore.cashflowScore,
    failedRate: scenario.failedTransactions / scenario.totalTransactions,
    currentBalance: scenario.balance,
    totalDeposits: scenario.totalDeposits,
    totalWithdrawals: scenario.totalWithdrawals,
    liquidityRatio: scenario.balance / scenario.monthlyIncome,
  });

  return {
    behaviorScore,
    creditScore,
    riskLevel: riskClassification.riskLevel,
    decision: helpers.generateCreditDecision(creditScore, riskClassification.riskLevel),
    recommendedAmount: helpers.calculateRecommendedLoanAmount(
      creditScore,
      riskClassification.riskLevel,
      loanConfig
    ),
    repaymentConfidence: helpers.calculateRepaymentConfidence(creditScore, riskClassification.riskLevel),
    riskFactors: riskClassification.riskFactors,
  };
}

describe('Business underwriting scenarios', () => {
  const scenarios = [
    {
      name: 'Rajesh Kumar',
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
      minAmount: 50000,
      maxAmount: 75000,
      expectedConfidence: 'HIGH',
    },
    {
      name: 'Amit Singh',
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
      minAmount: 20000,
      maxAmount: 35000,
    },
    {
      name: 'Pooja Devi',
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
      minAmount: 55000,
      maxAmount: 70000,
      expectedConfidence: 'HIGH',
    },
  ];

  it.each(scenarios)('classifies $name correctly', (scenario) => {
    const result = evaluateScenario(scenario);

    expect(result.riskLevel).toBe(scenario.expectedRisk);
    expect(result.decision).toBe(scenario.expectedDecision);
    if (scenario.minAmount) {
      expect(result.recommendedAmount).toBeGreaterThanOrEqual(scenario.minAmount);
      expect(result.recommendedAmount).toBeLessThanOrEqual(scenario.maxAmount);
    }
    if (scenario.expectedConfidence) {
      expect(result.repaymentConfidence).toBe(scenario.expectedConfidence);
    }
  });

  it('rejects empty history instead of approving thin files', () => {
    const behaviorScore = scoring.calculateOverallBehaviorScore(
      {
        totalTransactions: 0,
        failedTransactions: 0,
        incomeConsistencyScore: 50,
        averageMonthlyInflow: 0,
        averageMonthlyOutflow: 0,
      },
      {
        totalDeposits: 0,
        totalWithdrawals: 0,
        currentBalance: 0,
        savingsFrequency: 0,
        averageDeposit: 0,
        averageWithdrawal: 0,
      }
    );

    const creditScore = scoring.calculateCreditScore(
      { totalTransactions: 0, failedTransactions: 0 },
      { totalDeposits: 0, totalWithdrawals: 0, currentBalance: 0 },
      behaviorScore
    );
    const risk = analysis.classifyRisk({
      creditScore,
      transactionScore: behaviorScore.transactionScore,
      savingsScore: behaviorScore.savingsScore,
      cashflowScore: behaviorScore.cashflowScore,
    });

    expect(risk.riskLevel).toBe('HIGH');
    expect(helpers.generateCreditDecision(creditScore, risk.riskLevel)).toBe('REJECTED');
  });
});
