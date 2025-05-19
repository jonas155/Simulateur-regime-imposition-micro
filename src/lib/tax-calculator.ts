// src/lib/tax-calculator.ts

/**
 * Calculates French income tax based on progressive tax brackets for 1 part (single person).
 * Uses rates for 2023 income, taxed in 2024.
 * @param taxableIncome The net taxable income.
 * @returns The calculated income tax amount.
 */
export function calculateIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) {
    return 0;
  }

  const brackets = [
    { limit: 11294, rate: 0.00 },
    { limit: 28797, rate: 0.11 },
    { limit: 82341, rate: 0.30 },
    { limit: 177106, rate: 0.41 },
    { limit: Infinity, rate: 0.45 },
  ];

  let tax = 0;
  let previousLimit = 0;

  for (const bracket of brackets) {
    if (taxableIncome > previousLimit) {
      const taxableInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
      tax += taxableInBracket * bracket.rate;
      previousLimit = bracket.limit;
    } else {
      break;
    }
  }

  return parseFloat(tax.toFixed(2));
}

export interface MicroRegimeResult {
  taxableIncome: number;
  taxAmount: number;
  allowanceApplied: number;
  urssafSocialContributions: number;
  cfpContribution: number;
}

const URSSAF_SOCIAL_RATE_BNC = 0.212; // Taux approximatif pour 2024
const CFP_RATE_BNC = 0.002; // Taux pour activités libérales 2024

/**
 * Calculates tax details for Régime Micro-Entreprise (specifically Micro-BNC).
 * Assumes BNC with a 34% flat-rate allowance, minimum €305 for income tax.
 * Calculates URSSAF social contributions and CFP based on gross revenue.
 * @param annualRevenue The annual revenue.
 * @returns An object containing taxable income, tax amount, allowance applied, URSSAF social contributions, and CFP.
 */
export function calculateMicroRegimeTax(annualRevenue: number): MicroRegimeResult {
  const revenue = Math.max(0, annualRevenue); // Ensure revenue is not negative

  // Income tax calculation
  const percentageAllowance = revenue * 0.34;
  const minAllowance = 305;
  const effectiveAllowance = Math.min(revenue, Math.max(percentageAllowance, minAllowance));
  let taxableIncomeForTax = revenue - effectiveAllowance;
  if (taxableIncomeForTax < 0) {
    taxableIncomeForTax = 0;
  }
  const taxAmount = calculateIncomeTax(taxableIncomeForTax);

  // URSSAF contributions calculation (based on gross revenue for Micro-BNC)
  const urssafSocialContributions = revenue * URSSAF_SOCIAL_RATE_BNC;
  const cfpContribution = revenue * CFP_RATE_BNC;

  return {
    taxableIncome: parseFloat(taxableIncomeForTax.toFixed(2)),
    taxAmount,
    allowanceApplied: parseFloat(effectiveAllowance.toFixed(2)),
    urssafSocialContributions: parseFloat(urssafSocialContributions.toFixed(2)),
    cfpContribution: parseFloat(cfpContribution.toFixed(2)),
  };
}

export interface ReelRegimeResult {
  taxableIncome: number;
  taxAmount: number;
}

/**
 * Calculates tax details for Régime Réel.
 * Taxable income is annual revenue minus annual expenses.
 * @param annualRevenue The annual revenue.
 * @param annualExpenses The annual expenses.
 * @returns An object containing taxable income and tax amount.
 */
export function calculateReelRegimeTax(annualRevenue: number, annualExpenses: number): ReelRegimeResult {
  const revenue = Math.max(0, annualRevenue);
  const expenses = Math.max(0, annualExpenses);

  let taxableIncome = revenue - expenses;
  if (taxableIncome < 0) {
    taxableIncome = 0;
  }

  const taxAmount = calculateIncomeTax(taxableIncome);

  return {
    taxableIncome: parseFloat(taxableIncome.toFixed(2)),
    taxAmount,
  };
}
