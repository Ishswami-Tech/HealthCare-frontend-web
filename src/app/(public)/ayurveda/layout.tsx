"use client";

import React from 'react';
import { Inter, Playfair_Display } from 'next/font/google';
import { cn } from '@/lib/utils';
import Navigation from '@/components/ayurveda/Navigation';
import Footer from '@/components/ayurveda/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export default function AyurvedaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50",
      inter.variable,
      playfair.variable
    )}>
      <Navigation />
      <main>
        {children}
      </main>
      <Footer />
    </div>
  );
}
