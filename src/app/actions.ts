'use server';

import { z } from 'zod';
import { taxSystemRecommendation, type TaxRecommendationInput } from '@/ai/flows/tax-system-recommendation';
import { 
  calculateMicroRegimeTax, 
  calculateReelRegimeTax,
  type MicroRegimeResult,
  type ReelRegimeResult
} from '@/lib/tax-calculator';

const SimulationInputSchema = z.object({
  annualRevenue: z.number().min(0, "Le chiffre d'affaires annuel doit être positif ou nul."),
  annualExpenses: z.number().min(0, "Les charges annuelles doivent être positives ou nulles."),
});

export interface SimulationResult {
  micro: MicroRegimeResult;
  reel: ReelRegimeResult;
  aiRecommendation: string | null;
  error?: string;
}

export async function getTaxSimulation(
  data: z.infer<typeof SimulationInputSchema>
): Promise<SimulationResult> {
  const validation = SimulationInputSchema.safeParse(data);
  if (!validation.success) {
    return {
      // Provide default/zeroed results for micro and reel to avoid undefined errors in UI
      micro: { taxableIncome: 0, taxAmount: 0, allowanceApplied: 0 },
      reel: { taxableIncome: 0, taxAmount: 0 },
      aiRecommendation: null,
      error: validation.error.errors.map(e => e.message).join(', ')
    };
  }

  const { annualRevenue, annualExpenses } = validation.data;

  try {
    const microResult = calculateMicroRegimeTax(annualRevenue);
    const reelResult = calculateReelRegimeTax(annualRevenue, annualExpenses);

    let aiRecommendationText: string | null = null;
    try {
      const aiInput: TaxRecommendationInput = { annualRevenue, annualExpenses };
      const recommendationOutput = await taxSystemRecommendation(aiInput);
      aiRecommendationText = recommendationOutput.recommendation;
    } catch (aiError) {
      console.error("AI recommendation error:", aiError);
      aiRecommendationText = "La recommandation IA n'a pas pu être générée.";
      // Continue without AI recommendation if it fails
    }
    
    return {
      micro: microResult,
      reel: reelResult,
      aiRecommendation: aiRecommendationText,
    };
  } catch (e) {
    console.error("Tax calculation error:", e);
    return {
      micro: { taxableIncome: 0, taxAmount: 0, allowanceApplied: 0 },
      reel: { taxableIncome: 0, taxAmount: 0 },
      aiRecommendation: null,
      error: "Une erreur est survenue lors du calcul des impôts."
    };
  }
}
