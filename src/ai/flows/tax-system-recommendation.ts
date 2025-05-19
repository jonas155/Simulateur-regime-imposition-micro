
// The directive tells the Next.js runtime that the code in this file should only be executed on the server.
'use server';

/**
 * @fileOverview Provides AI-powered recommendation on which tax system ('Régime Réel' or 'Régime Micro') is more beneficial.
 *
 * - taxSystemRecommendation - A function that provides a recommendation on the tax system.
 * - TaxRecommendationInput - The input type for the taxSystemRecommendation function.
 * - TaxRecommendationOutput - The return type for the taxSystemRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TaxRecommendationInputSchema = z.object({
  annualRevenue: z
    .number()
    .describe('The annual revenue of the business.'),
  annualExpenses: z
    .number()
    .describe('The annual expenses of the business.'),
});
export type TaxRecommendationInput = z.infer<typeof TaxRecommendationInputSchema>;

const TaxRecommendationOutputSchema = z.object({
  recommendation: z.string().describe(
    "Une brève recommandation en français sur si le Régime Réel ou le Régime Micro est plus avantageux, basée sur les données financières fournies."
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
  prompt: `Compte tenu des informations financières suivantes, fournissez une brève recommandation EN FRANÇAIS pour déterminer si le 'Régime Réel' ou le 'Régime Micro' est probablement plus avantageux. Expliquez votre raisonnement.

Chiffre d'affaires annuel : {{{annualRevenue}}}
Charges annuelles : {{{annualExpenses}}}

Considérez que le Régime Micro est plus simple mais comporte un abattement forfaitaire pour les charges, tandis que le Régime Réel permet de déduire les charges réelles mais nécessite une comptabilité plus détaillée. Concentrez votre recommandation sur le régime qui entraînera une baisse de l'impôt sur le revenu, en fonction des charges réduisant le revenu imposable. La réponse doit être uniquement en français.
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

