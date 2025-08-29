/**
 * Animation configurations for Framer Motion
 * Centralized animation system for consistent motion design
 */

import { Variants, Transition } from "motion/react";

// ============================================================================
// EASING CURVES - Professional motion design
// ============================================================================

export const easings = {
  // Standard easing for most animations
  standard: [0.4, 0.0, 0.2, 1],
  // Emphasized easing for important elements
  emphasized: [0.2, 0.0, 0, 1],
  // Decelerated easing for entering elements
  decelerated: [0.0, 0.0, 0.2, 1],
  // Accelerated easing for exiting elements
  accelerated: [0.4, 0.0, 1, 1],
  // Bouncy easing for playful interactions
  bouncy: [0.68, -0.55, 0.265, 1.55],
} as const;

// ============================================================================
// DURATION TOKENS - Consistent timing
// ============================================================================

export const durations = {
  // Micro-interactions (hover, focus)
  fast: 0.15,
  // Standard transitions
  normal: 0.3,
  // Complex animations
  slow: 0.5,
  // Page transitions
  slower: 0.7,
  // Hero animations
  slowest: 1.0,
} as const;

// ============================================================================
// PAGE TRANSITIONS - Smooth navigation
// ============================================================================

export const pageTransitions: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: durations.slow,
      ease: easings.decelerated,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: durations.normal,
      ease: easings.accelerated,
    },
  },
};

// ============================================================================
// SCROLL REVEAL ANIMATIONS - Progressive disclosure
// ============================================================================

export const scrollReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 60,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: durations.slow,
      ease: easings.decelerated,
    },
  },
};

export const scrollRevealLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -60,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: durations.slow,
      ease: easings.decelerated,
    },
  },
};

export const scrollRevealRight: Variants = {
  hidden: {
    opacity: 0,
    x: 60,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: durations.slow,
      ease: easings.decelerated,
    },
  },
};

// ============================================================================
// STAGGER ANIMATIONS - Sequential reveals
// ============================================================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: durations.normal,
      ease: easings.decelerated,
    },
  },
};

// ============================================================================
// HOVER ANIMATIONS - Interactive feedback
// ============================================================================

export const hoverScale: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: {
      duration: durations.fast,
      ease: easings.standard,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: durations.fast,
      ease: easings.standard,
    },
  },
};

export const hoverLift: Variants = {
  rest: { 
    y: 0,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  },
  hover: {
    y: -8,
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 20px -5px rgba(0, 0, 0, 0.1)",
    transition: {
      duration: durations.normal,
      ease: easings.decelerated,
    },
  },
};

export const hoverGlow: Variants = {
  rest: { 
    boxShadow: "0 0 0 0 rgba(249, 115, 22, 0)",
  },
  hover: {
    boxShadow: "0 0 20px 5px rgba(249, 115, 22, 0.3)",
    transition: {
      duration: durations.normal,
      ease: easings.standard,
    },
  },
};

// ============================================================================
// MICRO-INTERACTIONS - Delightful details
// ============================================================================

export const rippleEffect: Variants = {
  initial: {
    scale: 0,
    opacity: 0.8,
  },
  animate: {
    scale: 4,
    opacity: 0,
    transition: {
      duration: 0.6,
      ease: easings.standard,
    },
  },
};

export const underlineSlide: Variants = {
  rest: { width: 0 },
  hover: {
    width: "100%",
    transition: {
      duration: durations.normal,
      ease: easings.decelerated,
    },
  },
};

export const iconRotate: Variants = {
  rest: { rotate: 0 },
  hover: {
    rotate: 360,
    transition: {
      duration: durations.slow,
      ease: easings.standard,
    },
  },
};

export const iconBounce: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 0.4,
      ease: easings.bouncy,
    },
  },
};

// ============================================================================
// LOADING ANIMATIONS - Smooth loading states
// ============================================================================

export const fadeInOut: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: durations.normal,
      ease: easings.standard,
    },
  },
};

export const slideUp: Variants = {
  hidden: {
    opacity: 0,
    y: 100,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.slow,
      ease: easings.decelerated,
    },
  },
};

export const slideDown: Variants = {
  hidden: {
    opacity: 0,
    y: -100,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.slow,
      ease: easings.decelerated,
    },
  },
};

// ============================================================================
// MODAL & OVERLAY ANIMATIONS
// ============================================================================

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: durations.normal,
      ease: easings.standard,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: durations.normal,
      ease: easings.standard,
    },
  },
};

export const modalContent: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 50,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.decelerated,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: {
      duration: durations.fast,
      ease: easings.accelerated,
    },
  },
};

// ============================================================================
// UTILITY FUNCTIONS - Animation helpers
// ============================================================================

/**
 * Creates a stagger transition with custom delay
 */
export const createStagger = (staggerDelay: number = 0.1, delayChildren: number = 0) => ({
  staggerChildren: staggerDelay,
  delayChildren,
});

/**
 * Creates a spring transition with custom config
 */
export const createSpring = (stiffness: number = 100, damping: number = 10): Transition => ({
  type: "spring",
  stiffness,
  damping,
});

/**
 * Creates a custom easing transition
 */
export const createEasing = (duration: number, ease: number[]): Transition => ({
  duration,
  ease: ease as [number, number, number, number],
});

/**
 * Viewport configuration for scroll animations
 */
export const scrollViewport = {
  once: true,
  margin: "-100px 0px",
  amount: 0.3,
} as const;
