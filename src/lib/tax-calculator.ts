// src/lib/tax-calculator.ts

export type ActivityType = "VENTE_BIC" | "SERVICE_BIC" | "LIBERAL_BNC_AUTRE" | "LIBERAL_BNC_CIPAV";

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
  allowanceRate: number;
  urssafSocialContributionsRate: number;
  cfpRate: number;
  urssafSocialContributions: number;
  cfpContribution: number;
  totalUrssafContributions: number;
  netIncomeAfterAll: number;
}

interface MicroRates {
  allowanceRate: number;
  urssafSocialRate: number;
  cfpRate: number;
  minAllowance: number;
}

function getMicroRates(activityType: ActivityType): MicroRates {
  switch (activityType) {
    case "VENTE_BIC": // Ventes de marchandises, denrées à emporter/sur place, fourniture logement
      return { allowanceRate: 0.71, urssafSocialRate: 0.123, cfpRate: 0.001, minAllowance: 305 };
    case "SERVICE_BIC": // Prestations de services commerciales et artisanales (BIC)
      return { allowanceRate: 0.50, urssafSocialRate: 0.212, cfpRate: 0.001, minAllowance: 305 }; // CFP pour services commerciaux, artisans c'est 0.3%
    case "LIBERAL_BNC_AUTRE": // Autres prestations de services (BNC), non CIPAV
      return { allowanceRate: 0.34, urssafSocialRate: 0.231, cfpRate: 0.002, minAllowance: 305 };
    case "LIBERAL_BNC_CIPAV": // Professions libérales réglementées relevant de la Cipav
      return { allowanceRate: 0.34, urssafSocialRate: 0.232, cfpRate: 0.002, minAllowance: 305 };
    default: // Fallback, should ideally not be reached if form validation is correct
      return { allowanceRate: 0.34, urssafSocialRate: 0.231, cfpRate: 0.002, minAllowance: 305 };
  }
}

/**
 * Calculates tax details for Régime Micro-Entreprise.
 * Takes into account activity type for allowances and URSSAF rates.
 * @param annualRevenue The annual revenue.
 * @param activityType The type of activity.
 * @returns An object containing detailed tax and contribution calculations.
 */
export function calculateMicroRegimeTax(annualRevenue: number, activityType: ActivityType): MicroRegimeResult {
  const revenue = Math.max(0, annualRevenue);
  const rates = getMicroRates(activityType);

  // Income tax calculation
  const percentageAllowance = revenue * rates.allowanceRate;
  const effectiveAllowance = Math.min(revenue, Math.max(percentageAllowance, rates.minAllowance));
  let taxableIncomeForTax = revenue - effectiveAllowance;
  if (taxableIncomeForTax < 0) {
    taxableIncomeForTax = 0;
  }
  const taxAmount = calculateIncomeTax(taxableIncomeForTax);

  // URSSAF contributions calculation
  const urssafSocialContributions = revenue * rates.urssafSocialRate;
  const cfpContribution = revenue * rates.cfpRate;
  const totalUrssafContributions = urssafSocialContributions + cfpContribution;

  const netIncomeAfterAll = revenue - taxAmount - totalUrssafContributions;

  return {
    taxableIncome: parseFloat(taxableIncomeForTax.toFixed(2)),
    taxAmount,
    allowanceApplied: parseFloat(effectiveAllowance.toFixed(2)),
    allowanceRate: rates.allowanceRate,
    urssafSocialContributionsRate: rates.urssafSocialRate,
    cfpRate: rates.cfpRate,
    urssafSocialContributions: parseFloat(urssafSocialContributions.toFixed(2)),
    cfpContribution: parseFloat(cfpContribution.toFixed(2)),
    totalUrssafContributions: parseFloat(totalUrssafContributions.toFixed(2)),
    netIncomeAfterAll: parseFloat(netIncomeAfterAll.toFixed(2)),
  };
}

export interface ReelRegimeResult {
  taxableIncome: number;
  taxAmount: number;
  netIncomeAfterTax: number;
}

/**
 * Calculates tax details for Régime Réel.
 * Taxable income is annual revenue minus annual expenses.
 * @param annualRevenue The annual revenue.
 * @param annualExpenses The annual expenses.
 * @returns An object containing taxable income, tax amount, and net income after tax.
 */
export function calculateReelRegimeTax(annualRevenue: number, annualExpenses: number): ReelRegimeResult {
  const revenue = Math.max(0, annualRevenue);
  const expenses = Math.max(0, annualExpenses);

  let taxableIncome = revenue - expenses;
  if (taxableIncome < 0) {
    taxableIncome = 0;
  }

  const taxAmount = calculateIncomeTax(taxableIncome);
  const netIncomeAfterTax = revenue - expenses - taxAmount;


  return {
    taxableIncome: parseFloat(taxableIncome.toFixed(2)),
    taxAmount,
    netIncomeAfterTax: parseFloat(netIncomeAfterTax.toFixed(2)),
  };
}
