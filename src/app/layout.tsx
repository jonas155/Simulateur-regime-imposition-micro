import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google'; // Using Inter as a fallback, Geist is defined below
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster";


const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Fiscal Navigator - Simulateur de Régime d\'Imposition',
  description: 'Calculez vos impôts et obtenez une recommandation pour choisir entre Régime Réel et Régime Micro.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable,
          GeistSans.variable,
          GeistMono.variable
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
