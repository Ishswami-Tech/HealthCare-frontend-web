"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  LazyMotion,
  MotionConfig,
  animate,
  domAnimation,
  m,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import { cn } from "@/lib/utils";

/** Expo-style ease-out shared by all homepage motion. */
export const HOME_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const VIEWPORT = { once: true, amount: 0.15 } as const;

/**
 * Loads motion features lazily for the homepage and honours the visitor's
 * reduced-motion preference (transforms are skipped, opacity fades remain).
 */
export function HomeMotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

/* -------------------------------------------------------------------------- */
/*  Scroll reveals                                                             */
/* -------------------------------------------------------------------------- */

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 26, filter: "blur(6px)" },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.75, ease: HOME_EASE, delay },
  }),
};

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/** Fades, lifts and un-blurs its children the first time they scroll into view. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <m.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={revealVariants}
      custom={delay}
    >
      {children}
    </m.div>
  );
}

interface RevealGroupProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}

/** Staggers the reveal of nested `RevealItem` children. */
export function RevealGroup({ children, className, stagger = 0.07, delay = 0.05 }: RevealGroupProps) {
  const groupVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };

  return (
    <m.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={groupVariants}
    >
      {children}
    </m.div>
  );
}

/**
 * Shared by `RevealItem` and by callers that need the staggered entrance on
 * an element `RevealItem` cannot provide — a card that must itself be the
 * grid item, for instance, because it carries `grid-rows-subgrid`.
 */
export const REVEAL_ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(5px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.65, ease: HOME_EASE } },
};

const itemVariants = REVEAL_ITEM_VARIANTS;

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <m.div className={className} variants={itemVariants}>
      {children}
    </m.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Headline reveal                                                            */
/* -------------------------------------------------------------------------- */

const lineVariants: Variants = {
  hidden: { y: "110%" },
  visible: (delay: number = 0) => ({
    y: "0%",
    transition: { duration: 0.9, ease: HOME_EASE, delay },
  }),
};

/**
 * Slides a single headline line up from behind a clipping mask.
 * Each line needs its own instance so the mask tracks the line box.
 */
export function MaskLine({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <span className="block overflow-hidden pb-[0.12em]">
      <m.span
        className={cn("block", className)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={lineVariants}
        custom={delay}
      >
        {children}
      </m.span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Decorative motion                                                          */
/* -------------------------------------------------------------------------- */

interface FloatProps {
  children?: ReactNode;
  className?: string;
  distance?: number;
  duration?: number;
  delay?: number;
}

/** Gentle vertical float loop for decorative elements. */
export function Float({ children, className, distance = 10, duration = 6, delay = 0 }: FloatProps) {
  return (
    <m.div
      className={className}
      animate={{ y: [0, -distance, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </m.div>
  );
}

/**
 * Moves its children against the scroll direction while the section is on
 * screen. `strength` is the total travel in pixels across the whole pass.
 */
export function Parallax({
  children,
  className,
  strength = 60,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const raw = useTransform(scrollYProgress, [0, 1], [strength / 2, -strength / 2]);
  const y = useSpring(raw, { stiffness: 90, damping: 24, mass: 0.4 });

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className}>
      <m.div style={{ y }}>{children}</m.div>
    </div>
  );
}

/** Infinite horizontal marquee. Children are duplicated to close the loop. */
export function Marquee({
  children,
  className,
  duration = 30,
  reverse = false,
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
  reverse?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={cn("flex flex-wrap items-center gap-10", className)}>{children}</div>;
  }

  return (
    <m.div
      className={cn("flex w-max items-center", className)}
      animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
      transition={{ duration, ease: "linear", repeat: Infinity }}
    >
      {children}
      {children}
    </m.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Numbers                                                                    */
/* -------------------------------------------------------------------------- */

interface CountUpProps {
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

/** Counts from zero to `to` the first time it scrolls into view. */
export function CountUp({
  to,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1.8,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const prefersReducedMotion = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    if (prefersReducedMotion) {
      setValue(to);
      return;
    }

    const controls = animate(0, to, {
      duration,
      ease: HOME_EASE,
      onUpdate: (latest) => setValue(latest),
    });

    return () => controls.stop();
  }, [isInView, to, duration, prefersReducedMotion]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
