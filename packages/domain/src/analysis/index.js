// Analysis Engine - Financial behavior analysis
//
// All thresholds and bands come from shared/config (config.scoring) — the
// single source of truth. This file owns only the classification logic.

const config = require('shared/config');

const thresholds = config.scoring.thresholds;
const riskThresholds = config.scoring.riskThresholds;

/**
 * Analyze savings profile based on patterns
 * @param {Object} savingsData - Savings history data
 * @returns {Object} Savings profile analysis
 */
function analyzeSavingsProfile(savingsData) {
  const { totalDeposits, totalWithdrawals, depositCount, withdrawalCount, averageDeposit, averageWithdrawal } = savingsData;

  // Calculate key ratios
  const savingsRatio = totalDeposits / (totalDeposits + totalWithdrawals || 1);
  const depositWithdrawalRatio = totalWithdrawals / (totalDeposits || 1);
  const avgDepositPerMonth = averageDeposit;
  const avgWithdrawalPerMonth = averageWithdrawal;

  // Determine profile type
  let profile = 'Stable Saver';
  let profileScore = 70;

  if (depositCount === 0 && withdrawalCount === 0) {
    profile = 'New User';
    profileScore = 50;
  } else if (depositCount > withdrawalCount * thresholds.stableSaverDepositMultiple &&
           savingsRatio > thresholds.stableSaverMinRatio) {
    profile = 'Stable Saver';
    profileScore = 85;
  } else if (depositCount > 0 && withdrawalCount > 0 &&
             avgWithdrawalPerMonth > avgDepositPerMonth * thresholds.highWithdrawalRatio) {
    profile = 'High Withdrawal User';
    profileScore = 45;
  } else if (depositCount < thresholds.seasonalMaxDepositCount &&
           totalDeposits > thresholds.seasonalMinDeposits) {
    profile = 'Seasonal Earner';
    profileScore = 55;
  } else if (totalWithdrawals > 0 && totalDeposits > 0 &&
             Math.abs(depositWithdrawalRatio - 1) < thresholds.merchantRatioTolerance) {
    profile = 'Merchant Cash Flow User';
    profileScore = 60;
  }

  return {
    profile,
    profileScore,
    totalDeposits,
    totalWithdrawals,
    savingsRatio: Math.round(savingsRatio * 100),
    depositCount,
    withdrawalCount,
    averageDeposit: Math.round(avgDepositPerMonth * 100) / 100,
    averageWithdrawal: Math.round(avgWithdrawalPerMonth * 100) / 100,
  };
}

/**
 * Analyze transaction patterns
 * @param {Object} transactionData - Transaction data
 * @returns {Object} Transaction pattern analysis
 */
function analyzeTransactionPatterns(transactionData) {
  const {
    totalTransactions,
    creditTransactions,
    debitTransactions,
    failedTransactions,
    monthlyInflow,
    monthlyOutflow,
    transactionsByDayOfWeek,
    transactionsByHour
  } = transactionData;

  // Calculate stability metrics
  const successRate = totalTransactions > 0
    ? (totalTransactions - failedTransactions) / totalTransactions
    : 0;

  // Analyze income frequency (for CREDIT transactions)
  let incomeConsistencyScore = 50;
  if (creditTransactions > 0) {
    const avgCreditsPerMonth = creditTransactions / 6; // Assuming 6 months of data
    if (avgCreditsPerMonth >= 2) {
      incomeConsistencyScore = Math.min(100, 50 + avgCreditsPerMonth * 15);
    } else {
      incomeConsistencyScore = 40;
    }
  }

  // Analyze spending patterns
  let spendingStabilityScore = 50;
  if (debitTransactions > 0) {
    const debitRatio = debitTransactions / totalTransactions;
    if (debitRatio >= 0.5 && debitRatio <= 0.8) {
      spendingStabilityScore = 70;
    } else if (debitRatio < 0.5) {
      spendingStabilityScore = 80;
    } else {
      spendingStabilityScore = 60;
    }
  }

  // Calculate inflow/outflow ratio
  const inflowOutflowRatio = monthlyOutflow > 0 ? monthlyInflow / monthlyOutflow : 0;
  let cashFlowHealth = 'BALANCED';
  if (inflowOutflowRatio > 1.5) {
    cashFlowHealth = 'SURPLUS';
  } else if (inflowOutflowRatio < 1.0) {
    cashFlowHealth = 'DEFICIT';
  }

  return {
    totalTransactions,
    creditTransactions,
    debitTransactions,
    failedTransactions,
    successRate: Math.round(successRate * 100),
    incomeConsistencyScore: Math.round(incomeConsistencyScore),
    spendingStabilityScore: Math.round(spendingStabilityScore),
    monthlyInflow: Math.round(monthlyInflow * 100) / 100,
    monthlyOutflow: Math.round(monthlyOutflow * 100) / 100,
    inflowOutflowRatio: Math.round(inflowOutflowRatio * 100) / 100,
    cashFlowHealth,
    averageMonthlyInflow: Math.round(monthlyInflow * 100) / 100,
    averageMonthlyOutflow: Math.round(monthlyOutflow * 100) / 100,
  };
}

/**
 * Classify user risk based on all factors
 * @param {Object} scores - All analysis scores
 * @returns {Object} Risk classification
 */
function classifyRisk(scores) {
  const {
    creditScore,
    transactionScore,
    savingsScore,
    cashflowScore,
    failedRate = 0,
    currentBalance,
    totalDeposits,
    totalWithdrawals,
    liquidityRatio,
  } = scores;

  const riskFactors = [];
  const protectiveFactors = [];

  // Risk factors
  if (transactionScore < thresholds.weakComponentScore) {
    riskFactors.push('Inconsistent transaction patterns');
  }
  if (savingsScore < thresholds.weakComponentScore) {
    riskFactors.push('Weak savings discipline');
  }
  if (cashflowScore < thresholds.weakComponentScore) {
    riskFactors.push('Unstable cash flow');
  }
  if (creditScore < riskThresholds.medium) {
    riskFactors.push('Low overall credit score');
  }
  if (failedRate >= thresholds.failedRateSevere) {
    riskFactors.push('Severe failed transaction rate');
  } else if (failedRate >= thresholds.failedRateElevated) {
    riskFactors.push('Elevated failed transaction rate');
  }
  if (currentBalance !== undefined && currentBalance < 0) {
    riskFactors.push('Negative savings balance');
  }
  if (totalDeposits !== undefined && totalWithdrawals !== undefined && totalWithdrawals > totalDeposits) {
    riskFactors.push('Withdrawals exceed deposits');
  }
  if (liquidityRatio !== undefined && liquidityRatio < thresholds.thinLiquidityRatio) {
    riskFactors.push('Thin liquidity buffer');
  }

  // Protective factors
  if (transactionScore >= thresholds.strongComponentScore) {
    protectiveFactors.push('Consistent transaction history');
  }
  if (savingsScore >= thresholds.strongComponentScore) {
    protectiveFactors.push('Strong savings discipline');
  }
  if (cashflowScore >= thresholds.strongComponentScore) {
    protectiveFactors.push('Stable cash flow management');
  }
  if (creditScore >= thresholds.excellentCreditScore) {
    protectiveFactors.push('Excellent credit behavior');
  }

  // Determine risk level
  let riskLevel = 'MEDIUM';
  if (creditScore >= riskThresholds.low && riskFactors.length === 0) {
    riskLevel = 'LOW';
  } else if (creditScore < riskThresholds.medium ||
             riskFactors.length >= thresholds.riskFactorCountHigh ||
             riskFactors.includes('Severe failed transaction rate') ||
             (riskFactors.includes('Negative savings balance') &&
              riskFactors.includes('Withdrawals exceed deposits'))) {
    riskLevel = 'HIGH';
  }

  return {
    riskLevel,
    riskFactors,
    protectiveFactors,
    scoreBreakdown: scores,
  };
}

/**
 * Analyze withdrawal behavior
 * @param {Object} savingsData - Savings history data
 * @returns {Object} Withdrawal behavior analysis
 */
function analyzeWithdrawalBehavior(savingsData) {
  const { totalWithdrawals, withdrawalCount, averageWithdrawal, largestWithdrawal } = savingsData;

  let behavior = 'NORMAL';

  if (withdrawalCount === 0) {
    behavior = 'NO_WITHDRAWALS';
  } else if (averageWithdrawal > thresholds.highValueWithdrawal) {
    behavior = 'HIGH_VALUE_WITHDRAWALS';
  } else if (withdrawalCount > thresholds.frequentWithdrawalCount) {
    behavior = 'FREQUENT_WITHDRAWALS';
  } else if (largestWithdrawal > averageWithdrawal * thresholds.irregularWithdrawalMultiple) {
    behavior = 'IRRUGLAR_WITHDRAWALS';
  }

  return {
    behavior,
    totalWithdrawals,
    withdrawalCount,
    averageWithdrawal: Math.round(averageWithdrawal * 100) / 100,
    largestWithdrawal,
  };
}

module.exports = {
  analyzeSavingsProfile,
  analyzeTransactionPatterns,
  classifyRisk,
  analyzeWithdrawalBehavior,
};
