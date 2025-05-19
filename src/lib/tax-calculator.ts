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
}

/**
 * Calculates tax details for Régime Micro-Entreprise (specifically Micro-BNC).
 * Assumes BNC with a 34% flat-rate allowance, minimum €305.
 * @param annualRevenue The annual revenue.
 * @returns An object containing taxable income, tax amount, and allowance applied.
 */
export function calculateMicroRegimeTax(annualRevenue: number): MicroRegimeResult {
  const revenue = Math.max(0, annualRevenue); // Ensure revenue is not negative

  const percentageAllowance = revenue * 0.34;
  const minAllowance = 305;
  
  // The allowance cannot exceed the revenue itself.
  const effectiveAllowance = Math.min(revenue, Math.max(percentageAllowance, minAllowance));

  let taxableIncome = revenue - effectiveAllowance;
  if (taxableIncome < 0) {
    taxableIncome = 0;
  }
  
  const taxAmount = calculateIncomeTax(taxableIncome);

  return {
    taxableIncome: parseFloat(taxableIncome.toFixed(2)),
    taxAmount,
    allowanceApplied: parseFloat(effectiveAllowance.toFixed(2)),
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
