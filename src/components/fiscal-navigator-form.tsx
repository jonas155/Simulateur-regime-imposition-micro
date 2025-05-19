'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Euro, Receipt, Sparkles, TrendingUp, TrendingDown, FileText, Info, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getTaxSimulation, type SimulationResult } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  annualRevenue: z.coerce.number().min(0, "Le chiffre d'affaires annuel doit être positif ou nul."),
  annualExpenses: z.coerce.number().min(0, "Les charges annuelles doivent être positives ou nulles."),
});

type FormData = z.infer<typeof formSchema>;

export default function FiscalNavigatorForm() {
  const [isPending, startTransition] = useTransition();
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      annualRevenue: undefined, // Let placeholder show
      annualExpenses: undefined,
    },
  });

  const onSubmit = (values: FormData) => {
    setSimulationResult(null); // Clear previous results
    startTransition(async () => {
      const result = await getTaxSimulation(values);
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Erreur de simulation",
          description: result.error,
        });
      }
      setSimulationResult(result);
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  };

  return (
    <Card className="w-full max-w-2xl shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
          <FileText size={32} />
        </div>
        <CardTitle className="text-3xl font-bold">Fiscal Navigator</CardTitle>
        <CardDescription className="text-lg">
          Simulez votre imposition et choisissez le régime le plus adapté.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="annualRevenue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Chiffre d'affaires annuel (€)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input 
                        type="number" 
                        placeholder="Ex: 50000" 
                        {...field} 
                        className="pl-10 text-base" 
                        step="any"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="annualExpenses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Charges annuelles déductibles (€)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input 
                        type="number" 
                        placeholder="Ex: 10000" 
                        {...field} 
                        className="pl-10 text-base"
                        step="any"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full text-lg py-6" disabled={isPending}>
              {isPending ? 'Calcul en cours...' : 'Simuler mon imposition'}
            </Button>
          </form>
        </Form>
      </CardContent>

      {isPending && (
        <CardFooter className="flex flex-col gap-4 pt-6">
          <Skeleton className="h-8 w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
          <Skeleton className="h-20 w-full mt-4" />
        </CardFooter>
      )}

      {simulationResult && !isPending && (
        <CardFooter className="flex flex-col gap-6 pt-6 border-t mt-6">
          <h3 className="text-2xl font-semibold text-center">Résultats de la simulation</h3>
          
          {simulationResult.error && (
             <Alert variant="destructive" className="w-full">
               <AlertTriangle className="h-4 w-4" />
               <AlertTitle>Erreur</AlertTitle>
               <AlertDescription>
                 {simulationResult.error}
               </AlertDescription>
             </Alert>
           )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {/* Régime Micro */}
            <Card className="bg-secondary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-primary">
                  <TrendingUp size={24} /> Régime Micro-Entreprise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Chiffre d'affaires: <span className="font-semibold">{formatCurrency(form.getValues('annualRevenue'))}</span></p>
                <p>Abattement forfaitaire (34%, min. 305€): <span className="font-semibold">{formatCurrency(simulationResult.micro.allowanceApplied)}</span></p>
                <p>Revenu imposable: <span className="font-semibold">{formatCurrency(simulationResult.micro.taxableIncome)}</span></p>
                <p className="text-base">Montant de l'impôt: <strong className="text-lg text-accent-foreground">{formatCurrency(simulationResult.micro.taxAmount)}</strong></p>
              </CardContent>
            </Card>

            {/* Régime Réel */}
            <Card className="bg-secondary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-primary">
                  <TrendingDown size={24} /> Régime Réel Simplifié
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Chiffre d'affaires: <span className="font-semibold">{formatCurrency(form.getValues('annualRevenue'))}</span></p>
                <p>Charges déductibles: <span className="font-semibold">{formatCurrency(form.getValues('annualExpenses'))}</span></p>
                <p>Revenu imposable: <span className="font-semibold">{formatCurrency(simulationResult.reel.taxableIncome)}</span></p>
                <p className="text-base">Montant de l'impôt: <strong className="text-lg text-accent-foreground">{formatCurrency(simulationResult.reel.taxAmount)}</strong></p>
              </CardContent>
            </Card>
          </div>

          {simulationResult.aiRecommendation && (
            <Alert className="w-full mt-4 border-accent bg-accent/10">
              <Sparkles className="h-5 w-5 text-accent" />
              <AlertTitle className="text-accent text-lg">Recommandation IA</AlertTitle>
              <AlertDescription className="text-sm">
                {simulationResult.aiRecommendation}
              </AlertDescription>
            </Alert>
          )}
           <Alert variant="default" className="mt-4 text-xs">
            <Info className="h-4 w-4" />
            <AlertTitle>Avertissement</AlertTitle>
            <AlertDescription>
              Cette simulation est fournie à titre indicatif et ne constitue pas un conseil fiscal. Les calculs sont basés sur le barème 2024 pour les revenus 2023 (1 part fiscale) et un abattement Micro-BNC. Consultez un professionnel pour une analyse personnalisée.
            </AlertDescription>
          </Alert>
        </CardFooter>
      )}
    </Card>
  );
}
