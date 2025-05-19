
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
    .describe('Le chiffre d\'affaires annuel de l\'entreprise.'),
  annualExpenses: z
    .number()
    .describe('Les charges annuelles réelles de l\'entreprise (pour le Régime Réel).'),
  activityType: ActivityTypeEnumSchema.describe(
    "Le type d\'activité : 'VENTE_BIC' (Ventes de marchandises), 'SERVICE_BIC' (Prestations de services BIC), 'LIBERAL_BNC_AUTRE' (Autres prestations de services BNC), ou 'LIBERAL_BNC_CIPAV' (Professions libérales réglementées CIPAV)."
  ),
});
export type TaxRecommendationInput = z.infer<typeof TaxRecommendationInputSchema>;

const TaxRecommendationOutputSchema = z.object({
  recommendation: z.string().describe(
    "Une brève recommandation EN FRANÇAIS sur si le Régime Réel ou le Régime Micro est plus avantageux, basée sur les données financières et le type d\'activité fournis. L\'explication doit comparer les résultats finaux (revenu net après impôts et toutes cotisations)."
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
  prompt: `Compte tenu des informations financières suivantes et du type d\'activité, fournissez une brève recommandation EN FRANÇAIS pour déterminer si le 'Régime Réel' ou le 'Régime Micro' est probablement plus avantageux. Expliquez votre raisonnement en comparant les résultats finaux (revenu net après impôts et toutes cotisations sociales).

Chiffre d\'affaires annuel : {{{annualRevenue}}}
Charges annuelles réelles (pour le Régime Réel) : {{{annualExpenses}}}
Type d\'activité : {{{activityType}}}

Informations clés pour votre analyse :

Régime Micro-Entreprise :
- L\'impôt sur le revenu est calculé sur le chiffre d\'affaires après un abattement forfaitaire pour frais professionnels. Cet abattement est de :
    - Ventes de marchandises (VENTE_BIC) : 71%
    - Prestations de services commerciales et artisanales (SERVICE_BIC) : 50%
    - Autres prestations de services (LIBERAL_BNC_AUTRE) et Professions libérales réglementées CIPAV (LIBERAL_BNC_CIPAV) : 34% (minimum 305€)
- Les cotisations sociales et la CFP sont calculées sur le chiffre d\'affaires brut (avant abattement) aux taux suivants :
    - VENTES_BIC : Cotisations sociales 12,3% + CFP 0,1% = 12,4%
    - SERVICE_BIC : Cotisations sociales 21,2% + CFP 0,1% = 21,3%
    - LIBERAL_BNC_AUTRE : Cotisations sociales 23,1% (évoluera à 24,6% en 2025, 26,1% en 2026) + CFP 0,2% = 23,3%
    - LIBERAL_BNC_CIPAV : Cotisations sociales 23,2% + CFP 0,2% = 23,4%
- L\'avantage du Micro est sa simplicité. Il est souvent plus intéressant si le total de vos charges réelles (y compris les cotisations sociales que vous paieriez au réel) est inférieur à l\'abattement forfaitaire du régime micro (attention, l\'abattement micro est pour l\'IR, les cotisations micro sont sur le CA).

Régime Réel Simplifié :
- Le bénéfice avant cotisations sociales est calculé comme (Chiffre d\'affaires - Charges annuelles réelles).
- Les charges annuelles réelles que vous fournissez sont déductibles.
- Les cotisations sociales sont estimées de la manière suivante : elles représentent 45% du bénéfice *après* déduction de ces mêmes cotisations. Le calcul précis est : (Bénéfice avant cotisations sociales / 1,45) * 0,45.
- Ces cotisations sociales estimées sont ensuite déduites du bénéfice avant cotisations sociales pour obtenir le bénéfice imposable à l\'impôt sur le revenu.
- L\'impôt sur le revenu est calculé sur ce bénéfice imposable final (Bénéfice avant cotisations sociales - Cotisations sociales estimées).
- Le Régime Réel est souvent plus intéressant si vos charges réelles (y compris les cotisations sociales calculées comme ci-dessus) sont significativement plus élevées que l\'abattement forfaitaire du régime Micro (qui ne couvre que les frais pour l\'IR, pas les cotisations sociales payées sur le CA).

Votre recommandation doit clairement indiquer quel régime semble le plus avantageux globalement (en termes de revenu net final après impôt sur le revenu ET toutes cotisations sociales) et pourquoi. Basez-vous sur une comparaison chiffrée du revenu net final pour chaque régime. La réponse doit être uniquement en français.
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
