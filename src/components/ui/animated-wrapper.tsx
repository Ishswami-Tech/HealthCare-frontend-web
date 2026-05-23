"use client";

import React from 'react';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHydrated } from '@/hooks/utils/useHydrated';
import {
  scrollReveal,
  scrollRevealLeft,
  scrollRevealRight,
  staggerContainer,
  staggerItem,
  hoverScale,
  hoverLift,
  hoverGlow,
  fadeInOut,
  slideUp,
  slideDown,
  scrollViewport,
} from '@/lib/config/animations';

// ============================================================================
// SCROLL REVEAL COMPONENTS
// ============================================================================

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'left' | 'right';
  delay?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className,
  direction = 'up',
  delay = 0,
}) => {
  const variants = {
    up: scrollReveal,
    left: scrollRevealLeft,
    right: scrollRevealRight,
  }[direction];

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className={cn(className)}
        initial="hidden"
        whileInView="visible"
        viewport={scrollViewport}
        variants={variants}
        transition={{ delay }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
};

// ============================================================================
// STAGGER ANIMATION COMPONENTS
// ============================================================================

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className,
  staggerDelay = 0.1,
  delayChildren = 0.1,
}) => {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className={cn(className)}
        initial="hidden"
        whileInView="visible"
        viewport={scrollViewport}
        variants={staggerContainer}
        transition={{
          staggerChildren: staggerDelay,
          delayChildren,
        }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
};

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className,
}) => {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className={cn(className)}
        variants={staggerItem}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
};

// ============================================================================
// HOVER ANIMATION COMPONENTS
// ============================================================================

interface HoverAnimationProps {
  children: React.ReactNode;
  className?: string;
  type?: 'scale' | 'lift' | 'glow';
  disabled?: boolean;
}

export const HoverAnimation: React.FC<HoverAnimationProps> = ({
  children,
  className,
  type = 'scale',
  disabled = false,
}) => {
  const mounted = useHydrated();

  if (disabled || !mounted) {
    return <div className={cn(className)}>{children}</div>;
  }

  const variants = {
    scale: hoverScale,
    lift: hoverLift,
    glow: hoverGlow,
  }[type];

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className={cn(className)}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        variants={variants}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
};

// ============================================================================
// PAGE TRANSITION WRAPPER
// ============================================================================

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className,
}) => {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className={cn(className)}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        transition={{
          duration: 0.5,
          ease: [0.0, 0.0, 0.2, 1],
        }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
};

// ============================================================================
// FADE ANIMATION COMPONENT
// ============================================================================

interface FadeAnimationProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'none';
  delay?: number;
  duration?: number;
}

export const FadeAnimation: React.FC<FadeAnimationProps> = ({
  children,
  className,
  direction = 'none',
  delay = 0,
  duration = 0.3,
}) => {
  const variants = {
    none: fadeInOut,
    up: slideUp,
    down: slideDown,
  }[direction];

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className={cn(className)}
        initial="hidden"
        animate="visible"
        variants={variants}
        transition={{ delay, duration }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
};

// ============================================================================
// LOADING ANIMATION COMPONENT
// ============================================================================

interface LoadingAnimationProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  isLoading,
  children,
  fallback,
  className,
}) => {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <m.div
          key="loading"
          className={cn(className)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {fallback || (
            <div className="flex items-center justify-center p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full size-8 border-b-2 border-primary"></div>
              </div>
            </div>
          )}
        </m.div>
      ) : (
        <m.div
          key="content"
          className={cn(className)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.0, 0.0, 0.2, 1] }}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// COUNTER ANIMATION COMPONENT
// ============================================================================

interface CounterAnimationProps {
  from: number;
  to: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export const CounterAnimation: React.FC<CounterAnimationProps> = ({
  from,
  to,
  duration = 2,
  className,
  suffix = '',
  prefix = '',
}) => {
  const [count, setCount] = React.useState(() => from);

  React.useEffect(() => {
    const start = Date.now();
    const distance = to - from;
    const durationMs = duration * 1000;

    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / durationMs, 1);
      const current = from + distance * progress;
      setCount(Math.round(current));

      if (progress >= 1) {
        clearInterval(timer);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [from, to, duration]);

  return (
    <m.span
      className={cn(className)}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={scrollViewport}
      transition={{ duration: 0.5 }}
    >
      {prefix}{count}{suffix}
    </m.span>
  );
};

// ============================================================================
// PARALLAX COMPONENT
// ============================================================================

interface ParallaxProps {
  children: React.ReactNode;
  className?: string;
  offset?: number;
}

export const Parallax: React.FC<ParallaxProps> = ({
  children,
  className,
  offset = 50,
}) => {
  return (
    <m.div
      className={cn(className)}
      initial={{ y: 0 }}
      whileInView={{ y: -offset }}
      viewport={{ once: false, amount: 0.5 }}
      transition={{
        duration: 0.8,
        ease: "easeOut",
      }}
    >
      {children}
    </m.div>
  );
};

