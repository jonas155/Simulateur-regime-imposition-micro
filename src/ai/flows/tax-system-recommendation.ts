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
    'A brief recommendation on whether Régime Réel or Régime Micro is more beneficial, based on the provided financial data.'
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
  prompt: `Given the following financial information, provide a brief recommendation on whether 'Régime Réel' or 'Régime Micro' is likely more beneficial. Explain your reasoning.

Annual Revenue: {{{annualRevenue}}}
Annual Expenses: {{{annualExpenses}}}

Consider that Régime Micro is simpler but has a fixed allowance for expenses, while Régime Réel allows deducting actual expenses but requires more detailed accounting.  Focus your recommendation on which regime will result in lower income tax, based on the expenses reducing taxable income.
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

