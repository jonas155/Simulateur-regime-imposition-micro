// src/app/actions.ts
'use server';

import { z } from 'zod';
import { taxSystemRecommendation, type TaxRecommendationInput } from '@/ai/flows/tax-system-recommendation';
import { 
  calculateMicroRegimeTax, 
  calculateReelRegimeTax,
  type MicroRegimeResult,
  type ReelRegimeResult,
  type ActivityType
} from '@/lib/tax-calculator';

const ActivityTypeEnum = z.enum(["VENTE_BIC", "SERVICE_BIC", "LIBERAL_BNC"], {
  errorMap: () => ({ message: "Veuillez sélectionner un type d'activité valide." })
});

const SimulationInputSchema = z.object({
  annualRevenue: z.number().min(0, "Le chiffre d'affaires annuel doit être positif ou nul."),
  annualExpenses: z.number().min(0, "Les charges annuelles doivent être positives ou nulles."),
  activityType: ActivityTypeEnum,
});

export interface SimulationResult {
  micro: MicroRegimeResult | null; // Can be null if inputs are invalid initially
  reel: ReelRegimeResult | null;   // Can be null if inputs are invalid initially
  aiRecommendation: string | null;
  error?: string;
  activityType?: ActivityType;
}

export async function getTaxSimulation(
  data: z.infer<typeof SimulationInputSchema>
): Promise<SimulationResult> {
  const validation = SimulationInputSchema.safeParse(data);
  if (!validation.success) {
    // Construct a default MicroRegimeResult with all zero values and rates for LIBERAL_BNC
    const defaultMicroResult: MicroRegimeResult = {
        taxableIncome: 0, taxAmount: 0, allowanceApplied: 0, 
        allowanceRate: 0.34, urssafSocialContributionsRate: 0.212, cfpRate: 0.002,
        urssafSocialContributions: 0, cfpContribution: 0, totalUrssafContributions: 0,
        netIncomeAfterAll: 0
    };
    return {
      micro: defaultMicroResult, // Provide default structure
      reel: { taxableIncome: 0, taxAmount: 0, netIncomeAfterTax: 0 }, // Provide default structure
      aiRecommendation: null,
      error: validation.error.errors.map(e => e.message).join(', '),
      activityType: data.activityType || "LIBERAL_BNC", // Pass through activity type or default
    };
  }

  const { annualRevenue, annualExpenses, activityType } = validation.data;

  try {
    const microResult = calculateMicroRegimeTax(annualRevenue, activityType);
    const reelResult = calculateReelRegimeTax(annualRevenue, annualExpenses);

    let aiRecommendationText: string | null = null;
    try {
      const aiInput: TaxRecommendationInput = { annualRevenue, annualExpenses, activityType };
      const recommendationOutput = await taxSystemRecommendation(aiInput);
      aiRecommendationText = recommendationOutput.recommendation;
    } catch (aiError) {
      console.error("AI recommendation error:", aiError);
      aiRecommendationText = "La recommandation IA n'a pas pu être générée.";
    }
    
    return {
      micro: microResult,
      reel: reelResult,
      aiRecommendation: aiRecommendationText,
      activityType,
    };
  } catch (e) {
    console.error("Tax calculation error:", e);
    const defaultMicroResult: MicroRegimeResult = {
        taxableIncome: 0, taxAmount: 0, allowanceApplied: 0, 
        allowanceRate: 0.34, urssafSocialContributionsRate: 0.212, cfpRate: 0.002,
        urssafSocialContributions: 0, cfpContribution: 0, totalUrssafContributions: 0,
        netIncomeAfterAll: 0
    };
    return {
      micro: defaultMicroResult,
      reel: { taxableIncome: 0, taxAmount: 0, netIncomeAfterTax: 0 },
      aiRecommendation: null,
      error: "Une erreur est survenue lors du calcul des impôts.",
      activityType,
    };
  }
}
