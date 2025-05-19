
// The directive tells the Next.js runtime that the code in this file should only be executed on the server.
'use server';

/**
 * @fileOverview Provides AI-powered recommendation on which tax system ('Régime Réel' or 'Régime Micro') is more beneficial, considering activity type.
 *
 * - taxSystemRecommendation - A function that provides a recommendation on the tax system.
 * - TaxRecommendationInput - The input type for the taxSystemRecommendation function.
 * - TaxRecommendationOutput - The return type for the taxSystemRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ActivityType } from '@/lib/tax-calculator'; // Import ActivityType

const ActivityTypeEnumSchema = z.enum(["VENTE_BIC", "SERVICE_BIC", "LIBERAL_BNC_AUTRE", "LIBERAL_BNC_CIPAV"]);

const TaxRecommendationInputSchema = z.object({
  annualRevenue: z
    .number()
    .describe('The annual revenue of the business.'),
  annualExpenses: z
    .number()
    .describe('The annual expenses of the business.'),
  activityType: ActivityTypeEnumSchema.describe(
    "Le type d'activité : 'VENTE_BIC' (Ventes de marchandises), 'SERVICE_BIC' (Prestations de services BIC), 'LIBERAL_BNC_AUTRE' (Autres prestations de services BNC), ou 'LIBERAL_BNC_CIPAV' (Professions libérales réglementées CIPAV)."
  ),
});
export type TaxRecommendationInput = z.infer<typeof TaxRecommendationInputSchema>;

const TaxRecommendationOutputSchema = z.object({
  recommendation: z.string().describe(
    "Une brève recommandation EN FRANÇAIS sur si le Régime Réel ou le Régime Micro est plus avantageux, basée sur les données financières et le type d'activité fournis."
  ),
});
export type TaxRecommendationOutput = z.infer<typeof TaxRecommendationOutputSchema>;

export async function taxSystemRecommendation(
  input: TaxRecommendationInput
): Promise<TaxRecommendationOutput> {
  return taxSystemRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'taxSystemRecommendationPrompt',
  input: {schema: TaxRecommendationInputSchema},
  output: {schema: TaxRecommendationOutputSchema},
  prompt: `Compte tenu des informations financières suivantes et du type d'activité, fournissez une brève recommandation EN FRANÇAIS pour déterminer si le 'Régime Réel' ou le 'Régime Micro' est probablement plus avantageux. Expliquez votre raisonnement.

Chiffre d'affaires annuel : {{{annualRevenue}}}
Charges annuelles : {{{annualExpenses}}}
Type d'activité : {{{activityType}}}

Rappel des abattements forfaitaires pour l'impôt sur le revenu en régime Micro (avantages fiscaux) :
- Ventes de marchandises (VENTE_BIC) : 71%
- Prestations de services commerciales et artisanales (SERVICE_BIC) : 50%
- Autres prestations de services (LIBERAL_BNC_AUTRE) et Professions libérales réglementées CIPAV (LIBERAL_BNC_CIPAV) : 34%

Taux globaux de cotisations sociales et CFP (Contribution à la Formation Professionnelle) sur le CA en régime Micro :
- Ventes de marchandises (VENTE_BIC) : Cotisations sociales 12,3% + CFP 0,1% = 12,4%
- Prestations de services commerciales et artisanales (SERVICE_BIC) : Cotisations sociales 21,2% + CFP 0,1% (pour services commerciaux) = 21,3%
- Autres prestations de services (LIBERAL_BNC_AUTRE) : Cotisations sociales 23,1% (taux actuel, évoluera à 24,6% en 2025 et 26,1% en 2026) + CFP 0,2% = 23,3%
- Professions libérales réglementées relevant de la Cipav (LIBERAL_BNC_CIPAV) : Cotisations sociales 23,2% + CFP 0,2% = 23,4%

Considérez que le Régime Micro est plus simple mais comporte un abattement forfaitaire pour les charges (dépendant du type d'activité) et des taux de cotisations sociales fixes sur le CA. Le Régime Réel permet de déduire les charges réelles mais nécessite une comptabilité plus détaillée, et les cotisations sociales sont calculées sur le bénéfice réel (plus complexes, non simulées ici en détail mais généralement plus élevées si le bénéfice est important). Concentrez votre recommandation sur le régime qui entraînera une baisse de l'impôt sur le revenu ET des charges sociales globales, en fonction des charges déductibles qui réduisent le revenu imposable. La réponse doit être uniquement en français.
`,
});

const taxSystemRecommendationFlow = ai.defineFlow(
  {
    name: 'taxSystemRecommendationFlow',
    inputSchema: TaxRecommendationInputSchema,
    outputSchema: TaxRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
