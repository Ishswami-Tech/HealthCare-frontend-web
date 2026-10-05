import type { Metadata } from "next";
import { Noto_Sans_Devanagari, Noto_Sans_Gujarati } from "next/font/google";
import { DietChartPrintView } from "./_components/DietChartPrintView";

// Loaded only on this route: the printed sheet must render Gujarati and
// Devanagari (Hindi / Marathi) scripts even on machines without Indic fonts.
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
  variable: "--font-diet-devanagari",
  display: "swap",
});

const gujarati = Noto_Sans_Gujarati({
  subsets: ["gujarati"],
  weight: ["400", "600", "700"],
  variable: "--font-diet-gujarati",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Diet Chart",
};

export default async function DietChartPrintPage({
  params,
}: {
  params: Promise<{ id: string; visitId: string }>;
}) {
  const { id, visitId } = await params;
  return (
    <DietChartPrintView
      patientId={id}
      visitId={visitId}
      fontClassName={`${devanagari.variable} ${gujarati.variable}`}
    />
  );
}
