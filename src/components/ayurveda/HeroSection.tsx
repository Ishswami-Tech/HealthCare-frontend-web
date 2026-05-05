"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ScrollReveal,
  HoverAnimation,
} from "@/components/ui/animated-wrapper";
import {
  Star,
  Award,
  Phone,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

const HeroSection = () => {
  const { t } = useTranslation();
  const [liveCount, setLiveCount] = useState(147);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount((prev) => prev + Math.floor(Math.random() * 3) - 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative isolate min-h-[90vh] lg:min-h-screen flex items-start pt-8 pb-12 overflow-hidden">
      {/* --- Premium Background Layer --- */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-primary/15 rounded-full blur-[100px] animate-pulse-soft" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px] animate-pulse-soft delay-1000" />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMCAwaDQwdjFIMHpNIDAgMHY0MGgxVjB6Ii8+PC9nPjwvZz48L3N2Zz4=')] mix-blend-overlay" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* --- Left Column: Content --- */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
            <ScrollReveal direction="up" delay={0.1}>
              <p className="text-primary font-bold tracking-wider uppercase text-sm mb-4">
                {t("hero.transformHealth")} <span className="underline decoration-2 underline-offset-4">{t("hero.ancientWisdom")}</span>
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.2}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.1]">
                <span className="block text-foreground">{t("hero.title1")}</span>
                <span className="block bg-gradient-to-r from-primary via-emerald-500 to-teal-600 bg-clip-text text-transparent italic py-2 drop-shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_0_20px_rgba(117,224,192,0.4)]">
                  {t("hero.title2")}
                </span>
                <span className="block text-foreground/90">{t("hero.title")}</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.3}>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl font-medium leading-relaxed">
                {t("hero.description")}
              </p>
            </ScrollReveal>

            <div className="relative z-30 flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto pt-2">
              <HoverAnimation type="glow" className="w-full rounded-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="relative w-full sm:w-auto rounded-full border-2 border-primary/50 bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/20 px-10 h-14 group overflow-hidden transition-all duration-500"
                  onClick={() => window.location.href = "tel:9860370961"}
                >
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer" />
                  
                  <span className="relative z-10 flex items-center justify-center font-bold text-lg">
                    {t("hero.primaryCta")}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Button>
              </HoverAnimation>
              
              <HoverAnimation type="scale" className="w-full rounded-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="group w-full sm:w-auto rounded-full border-2 border-primary/60 hover:border-primary bg-primary/5 hover:bg-primary/10 dark:bg-white/5 dark:hover:bg-primary/10 backdrop-blur-md px-10 h-14 font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-primary/10 text-foreground dark:text-primary"
                  onClick={() => window.location.href = "/treatments"}
                >
                  <Phone className="w-5 h-5 mr-2 text-foreground dark:text-primary group-hover:animate-pulse" />
                  {t("hero.secondaryCta")}
                </Button>
              </HoverAnimation>
            </div>

          </div>

          {/* --- Right Column: Visual --- */}
          <ScrollReveal direction="right" delay={0.3} className="relative w-full max-w-2xl mx-auto lg:ml-auto">
            <div className="relative aspect-square flex items-center justify-center">
              
              {/* Decorative Glow behind image */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-[120px] opacity-40 animate-pulse-soft" />
              
              {/* Main Image Container */}
              <div className="relative w-full h-full z-10 flex items-center justify-center">
                <div className="relative w-[85%] h-[85%] animate-float">
                  <Image
                    src="/assets/hero.png"
                    alt="Ayurvedic Healing"
                    fill
                    className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>

              {/* Trust Badges - Integrated Directly ON Image Area */}
              <div className="absolute inset-0 z-20 pointer-events-none">
                {/* Top Row: Overlapping Top of Image */}
                <div className="absolute top-[10%] left-0 w-full flex justify-center gap-2 px-4">
                  <motion.div 
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="glass-light px-3 py-1.5 rounded-full border border-white/40 shadow-lg flex items-center gap-1.5 pointer-events-auto hover:scale-105 transition-transform"
                  >
                    <CheckCircle className="w-3 h-3 text-primary" />
                    <span className="text-[9px] font-bold text-foreground uppercase tracking-wider">{t("hero.govCertified")}</span>
                  </motion.div>
                  <motion.div 
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="glass-light px-3 py-1.5 rounded-full border border-white/40 shadow-lg flex items-center gap-1.5 pointer-events-auto hover:scale-105 transition-transform"
                  >
                    <Award className="w-3 h-3 text-primary" />
                    <span className="text-[9px] font-bold text-foreground uppercase tracking-wider">{t("hero.iso9001Short")}</span>
                  </motion.div>
                </div>

                {/* Bottom Row: Overlapping Bottom of Image */}
                <div className="absolute bottom-[15%] left-0 w-full flex justify-center gap-2 px-4">
                  <motion.div 
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    className="glass-light px-3 py-1.5 rounded-full border border-white/40 shadow-lg flex items-center gap-1.5 pointer-events-auto hover:scale-105 transition-transform"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-[9px] font-bold text-foreground uppercase tracking-wider">{t("hero.natural")}</span>
                  </motion.div>
                  <motion.div 
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
                    className="glass-light px-3 py-1.5 rounded-full border border-white/40 shadow-lg flex items-center gap-1.5 pointer-events-auto hover:scale-105 transition-transform"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-[9px] font-bold text-foreground uppercase tracking-wider">{t("hero.noSideEffects")}</span>
                  </motion.div>
                  <motion.div 
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                    className="glass-light px-3 py-1.5 rounded-full border border-white/40 shadow-lg flex items-center gap-1.5 pointer-events-auto hover:scale-105 transition-transform"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-[9px] font-bold text-foreground uppercase tracking-wider">{t("hero.provenResults")}</span>
                  </motion.div>
                </div>
              </div>

              {/* Live Status Badge */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 glass-dark px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 whitespace-nowrap pointer-events-none">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-[8px] font-bold text-white uppercase tracking-widest">
                  {liveCount} {t("hero.peopleViewingText")}
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* --- Wave / Section Divider --- */}
      <div className="pointer-events-none absolute bottom-0 left-0 w-full overflow-hidden leading-[0] transform rotate-180">
        <svg className="relative block w-full h-[40px] sm:h-[60px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-muted/30"></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
