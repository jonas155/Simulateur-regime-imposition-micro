
// src/components/fiscal-navigator-form.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Euro, Receipt, Sparkles, TrendingUp, TrendingDown, FileText, Info, AlertTriangle, Briefcase, Activity, Percent } from 'lucide-react';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { ActivityType } from '@/lib/tax-calculator';

const ActivityTypeEnum = z.enum(["VENTE_BIC", "SERVICE_BIC", "LIBERAL_BNC_AUTRE", "LIBERAL_BNC_CIPAV"], {
  errorMap: () => ({ message: "Veuillez sélectionner un type d'activité." })
});

const formSchema = z.object({
  annualRevenue: z.coerce.number().min(0, "Le chiffre d'affaires annuel doit être positif ou nul.").default('' as unknown as number),
  annualExpenses: z.coerce.number().min(0, "Les charges annuelles doivent être positives ou nulles.").default('' as unknown as number),
  activityType: ActivityTypeEnum,
});

type FormData = z.infer<typeof formSchema>;

const activityTypeLabels: Record<ActivityType, string> = {
  VENTE_BIC: "Ventes de marchandises (BIC)",
  SERVICE_BIC: "Prestations de services commerciales/artisanales (BIC)",
  LIBERAL_BNC_AUTRE: "Autres prestations de services (BNC, non-CIPAV)",
  LIBERAL_BNC_CIPAV: "Professions libérales réglementées (BNC, CIPAV)",
};

export default function FiscalNavigatorForm() {
  const [isPending, startTransition] = useTransition();
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      annualRevenue: '' as unknown as number,
      annualExpenses: '' as unknown as number,
      activityType: "LIBERAL_BNC_AUTRE" as ActivityType, 
    },
  });

  const onSubmit = (values: FormData) => {
    setSimulationResult(null);
    startTransition(async () => {
      const result = await getTaxSimulation(values);
       if (result.error && (!result.micro || !result.reel || !result.micro.taxableIncome || !result.reel.taxableIncome )) { 
        toast({
          variant: "destructive",
          title: "Erreur de simulation",
          description: result.error,
        });
      }
      setSimulationResult(result);
    });
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return 'N/A';
    return value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  };
  
  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return 'N/A';
    return (value * 100).toFixed(1) + '%';
  }

  const currentActivityType = form.watch("activityType");

  return (
    <Card className="w-full max-w-3xl shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
          <FileText size={32} />
        </div>
        <CardTitle className="text-3xl font-bold">Fiscal Navigator</CardTitle>
        <CardDescription className="text-lg">
          Simulez votre imposition et vos cotisations selon votre type d'activité.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="activityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base flex items-center gap-2"><Activity size={18}/>Type d'activité</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-base">
                        <SelectValue placeholder="Sélectionnez un type d'activité" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(activityTypeLabels) as ActivityType[]).map((value) => (
                        <SelectItem key={value} value={value} className="text-base">
                          {activityTypeLabels[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                  <FormLabel className="text-base">Charges annuelles déductibles (€) (pour Régime Réel)</FormLabel>
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
              {isPending ? 'Calcul en cours...' : 'Simuler mon imposition & cotisations'}
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
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
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

      {simulationResult && simulationResult.micro && simulationResult.reel && !isPending && (
        <CardFooter className="flex flex-col gap-6 pt-6 border-t mt-6">
          <h3 className="text-2xl font-semibold text-center">Résultats de la simulation pour {activityTypeLabels[simulationResult.activityType || currentActivityType]}</h3>

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
                <Separator className="my-1" />
                <p className="font-medium text-primary-focus">Impôt sur le revenu :</p>
                <p>Abattement forfaitaire ({formatPercentage(simulationResult.micro.allowanceRate)}, min. 305€): <span className="font-semibold">{formatCurrency(simulationResult.micro.allowanceApplied)}</span></p>
                <p>Revenu imposable: <span className="font-semibold">{formatCurrency(simulationResult.micro.taxableIncome)}</span></p>
                <p>Montant de l'impôt: <strong className="text-accent-foreground">{formatCurrency(simulationResult.micro.taxAmount)}</strong></p>
                <Separator className="my-2" />
                <p className="font-medium text-primary-focus flex items-center gap-1"><Briefcase size={16}/> Cotisations URSSAF (estimations) :</p>
                <p>Cotisations sociales ({formatPercentage(simulationResult.micro.urssafSocialContributionsRate)}): <span className="font-semibold">{formatCurrency(simulationResult.micro.urssafSocialContributions)}</span></p>
                <p>CFP ({formatPercentage(simulationResult.micro.cfpRate)}): <span className="font-semibold">{formatCurrency(simulationResult.micro.cfpContribution)}</span></p>
                <p>Total cotisations URSSAF: <strong className="text-accent-foreground">{formatCurrency(simulationResult.micro.totalUrssafContributions)}</strong></p>
                <Separator className="my-2" />
                <p className="text-base font-semibold">Revenu net perçu (après impôt et cotisations):</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(simulationResult.micro.netIncomeAfterAll)}</p>
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
                 <Separator className="my-1" />
                <p className="font-medium text-primary-focus">Impôt sur le revenu :</p>
                <p>Charges déductibles: <span className="font-semibold">{formatCurrency(form.getValues('annualExpenses'))}</span></p>
                <p>Bénéfice imposable (base IR & cotisations): <span className="font-semibold">{formatCurrency(simulationResult.reel.taxableIncome)}</span></p>
                <p>Montant de l'impôt: <strong className="text-accent-foreground">{formatCurrency(simulationResult.reel.taxAmount)}</strong></p>
                <Separator className="my-2" />
                <p className="font-medium text-primary-focus flex items-center gap-1"><Briefcase size={16}/> Cotisations Sociales (estimation) :</p>
                <p>Taux estimé sur bénéfice: <span className="font-semibold">{formatPercentage(simulationResult.reel.estimatedSocialContributionsRate)}</span></p>
                <p>Montant estimé des cotisations: <strong className="text-accent-foreground">{formatCurrency(simulationResult.reel.estimatedSocialContributions)}</strong></p>
                <Separator className="my-2" />
                <p className="text-base font-semibold">Revenu net perçu (après impôt et estimation cotisations):</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(simulationResult.reel.netIncomeAfterAllContributions)}</p>
                 <p className="text-xs text-muted-foreground italic mt-2">
                  Les cotisations sociales au régime réel sont complexes et peuvent varier considérablement (ACRE, type d'activité, caisse de retraite, etc.). Le montant ci-dessus est une estimation grossière (environ {formatPercentage(simulationResult.reel.estimatedSocialContributionsRate)} du bénéfice) et ne remplace pas une simulation personnalisée.
                </p>
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
              Cette simulation est fournie à titre indicatif et ne constitue pas un conseil fiscal ou social. Les calculs d'impôt sur le revenu sont basés sur le barème 2024 pour les revenus 2023 (1 part fiscale). Les cotisations URSSAF en micro-entreprise sont des estimations basées sur les taux standards. Les cotisations au régime réel sont une estimation grossière. Consultez un professionnel pour une analyse personnalisée.
            </AlertDescription>
          </Alert>
        </CardFooter>
      )}
    </Card>
  );
}
