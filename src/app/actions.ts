
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
import { submitFeedback as submitFeedbackFlow, type FeedbackInput, type FeedbackOutput } from '@/ai/flows/submit-feedback-flow';


const ActivityTypeEnum = z.enum(["VENTE_BIC", "SERVICE_BIC", "LIBERAL_BNC_AUTRE", "LIBERAL_BNC_CIPAV"], {
  errorMap: () => ({ message: "Veuillez sélectionner un type d'activité valide." })
});

const SimulationInputSchema = z.object({
  annualRevenue: z.number().min(0, "Le chiffre d'affaires annuel doit être positif ou nul."),
  annualExpenses: z.number().min(0, "Les charges annuelles doivent être positives ou nulles."),
  activityType: ActivityTypeEnum,
});

export interface SimulationResult {
  micro: MicroRegimeResult | null; 
  reel: ReelRegimeResult | null;   
  aiRecommendation: string | null;
  error?: string;
  activityType?: ActivityType;
}

const defaultReelResult: ReelRegimeResult = { 
  taxableIncome: 0, 
  taxAmount: 0, 
  estimatedSocialContributionsRate: 0.45, // Default rate factor
  estimatedSocialContributions: 0,
  netIncomeAfterAllContributions: 0
};

const defaultMicroResult: MicroRegimeResult = {
    taxableIncome: 0, taxAmount: 0, allowanceApplied: 0, 
    allowanceRate: 0.34, urssafSocialContributionsRate: 0.231, cfpRate: 0.002,
    urssafSocialContributions: 0, cfpContribution: 0, totalUrssafContributions: 0,
    netIncomeAfterAll: 0
};


export async function getTaxSimulation(
  data: z.infer<typeof SimulationInputSchema>
): Promise<SimulationResult> {
  const validation = SimulationInputSchema.safeParse(data);
  if (!validation.success) {
    return {
      micro: defaultMicroResult, 
      reel: defaultReelResult, 
      aiRecommendation: null,
      error: validation.error.errors.map(e => e.message).join(', '),
      activityType: data.activityType || "LIBERAL_BNC_AUTRE", 
    };
  }

  const { annualRevenue, annualExpenses, activityType } = validation.data;

  try {
    const microResult = calculateMicroRegimeTax(annualRevenue, annualExpenses, activityType);
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
    return {
      micro: defaultMicroResult,
      reel: defaultReelResult,
      aiRecommendation: null,
      error: "Une erreur est survenue lors du calcul des impôts.",
      activityType,
    };
  }
}

// New server action for feedback submission
const FeedbackSubmissionInputSchema = z.object({
  feedbackText: z.string().min(1, "Feedback cannot be empty."),
});

export async function handleFeedbackSubmission(
  data: z.infer<typeof FeedbackSubmissionInputSchema>
): Promise<FeedbackOutput> {
  const validation = FeedbackSubmissionInputSchema.safeParse(data);
  if (!validation.success) {
    return { 
      success: false, 
      message: validation.error.errors.map(e => e.message).join(', ') 
    };
  }

  try {
    const result = await submitFeedbackFlow({ feedbackText: validation.data.feedbackText });
    return result;
  } catch (error) {
    console.error("Feedback submission error in server action:", error);
    let errorMessage = "Erreur interne du serveur lors de la soumission du retour.";
    if (error instanceof Error) {
        errorMessage = error.message; // Or more specific error handling
    }
    return { success: false, message: errorMessage };
  }
}
