
'use server';
/**
 * @fileOverview Handles submission of user feedback.
 *
 * - submitFeedback - A function to process user feedback.
 * - FeedbackInput - The input type for the submitFeedback function.
 * - FeedbackOutput - The return type for the submitFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FeedbackInputSchema = z.object({
  feedbackText: z.string().min(1, "Le retour ne peut pas être vide."),
});
export type FeedbackInput = z.infer<typeof FeedbackInputSchema>;

const FeedbackOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type FeedbackOutput = z.infer<typeof FeedbackOutputSchema>;

// This is the actual flow logic
const feedbackProcessorFlow = ai.defineFlow(
  {
    name: 'feedbackProcessorFlow',
    inputSchema: FeedbackInputSchema,
    outputSchema: FeedbackOutputSchema,
  },
  async (input): Promise<FeedbackOutput> => {
    try {
      // TODO: Implement actual Google Sheets integration here.
      // This could involve using the Google Sheets API via a Google Cloud Function,
      // or calling a Google Apps Script web app URL.
      // For now, we'll just log the feedback to the server console.
      console.log('User Feedback Received (simulated storage):', input.feedbackText);
      
      // Simulate a short delay as if interacting with an external service
      await new Promise(resolve => setTimeout(resolve, 500));

      return { success: true, message: 'Merci pour votre retour ! Il a bien été pris en compte.' };
    } catch (error) {
      console.error('Error processing feedback in Genkit flow:', error);
      // It's better to let the error propagate if it's unexpected,
      // or return a structured error if it's a known failure case.
      // For simplicity here, we'll catch and return a generic error message.
      return { success: false, message: 'Une erreur est survenue lors du traitement de votre retour par le flux.' };
    }
  }
);

// Exported wrapper function to be called by server actions
export async function submitFeedback(input: FeedbackInput): Promise<FeedbackOutput> {
  return feedbackProcessorFlow(input);
}
