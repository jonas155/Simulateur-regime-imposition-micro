
// src/components/feedback-dialog.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { handleFeedbackSubmission } from '@/app/actions'; // Will be created in actions.ts

const feedbackFormSchema = z.object({
  feedbackText: z
    .string()
    .min(10, { message: 'Votre retour doit contenir au moins 10 caractères.' })
    .max(2000, { message: 'Votre retour ne doit pas dépasser 2000 caractères.' }),
});

type FeedbackFormData = z.infer<typeof feedbackFormSchema>;

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      feedbackText: '',
    },
  });

  const onSubmit = (values: FeedbackFormData) => {
    startTransition(async () => {
      try {
        const result = await handleFeedbackSubmission({ feedbackText: values.feedbackText });
        if (result.success) {
          toast({
            title: 'Merci !',
            description: result.message,
          });
          form.reset();
          onOpenChange(false);
        } else {
          toast({
            variant: 'destructive',
            title: 'Erreur',
            description: result.message || 'Une erreur est survenue.',
          });
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erreur inattendue',
          description: 'Une erreur inattendue est survenue lors de la soumission de votre retour.',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Proposer une évolution ou faire une remarque</DialogTitle>
          <DialogDescription>
            Votre avis est précieux ! Décrivez votre idée ou votre remarque ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="feedbackText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Votre retour</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Suggérez une amélioration, signalez un bug, ou partagez simplement votre avis..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Envoi en cours...' : 'Envoyer le retour'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
