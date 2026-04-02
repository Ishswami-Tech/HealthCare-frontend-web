/**
 * Theme utilities for consistent light/dark mode styling
 * Provides pre-defined class combinations for common UI patterns
 * 
 * DESIGN SYSTEM: Emerald / Slate / White
 * PURPLE BAN: NO purple/violet/indigo allowed.
 */

// Background colors with dark mode variants
export const backgrounds = {
  // Primary backgrounds
  primary: "bg-white dark:bg-slate-900",
  secondary: "bg-slate-50 dark:bg-slate-800",
  tertiary: "bg-slate-100 dark:bg-slate-700",
  
  // Card backgrounds
  card: "bg-white dark:bg-slate-800",
  cardSecondary: "bg-slate-50 dark:bg-slate-900",
  
  // Gradient backgrounds
  gradientOrange: "bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-orange-900/10",
  gradientBlue: "bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/10",
  gradientEmerald: "bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-900/10",
  
  // Ayurveda specific gradients
  ayurvedaHero: "bg-gradient-to-br from-slate-50 via-white to-orange-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-orange-900/10",
} as const;

// Text colors with dark mode variants
export const textColors = {
  // Primary text
  primary: "text-slate-900 dark:text-white",
  secondary: "text-slate-700 dark:text-slate-300",
  tertiary: "text-slate-600 dark:text-slate-400",
  muted: "text-slate-500 dark:text-slate-500",
  
  // Headings
  heading: "text-slate-900 dark:text-white",
  subheading: "text-slate-700 dark:text-slate-300",
  
  // Special text
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-orange-600 dark:text-orange-400",
  error: "text-red-600 dark:text-red-400",
  info: "text-blue-600 dark:text-blue-400",
} as const;

// Border colors with dark mode variants
export const borders = {
  primary: "border-slate-200 dark:border-slate-700",
  secondary: "border-slate-300 dark:border-slate-600",
  light: "border-slate-100 dark:border-slate-800",
  
  // Colored borders
  orange: "border-orange-200 dark:border-orange-800",
  blue: "border-blue-200 dark:border-blue-800",
  green: "border-emerald-200 dark:border-emerald-800",
  emerald: "border-emerald-200 dark:border-emerald-800",
  red: "border-red-200 dark:border-red-800",
  yellow: "border-yellow-200 dark:border-yellow-800",
} as const;

// Badge/Chip color combinations
export const badges = {
  orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800",
  blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800",
  green: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800",
  red: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800",
  yellow: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800",
  gray: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700",
  cyan: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800",
  emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800",
  slate: "bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800",
} as const;

// Icon colors with dark mode variants
export const iconColors = {
  orange: "text-orange-600 dark:text-orange-400",
  blue: "text-blue-600 dark:text-blue-400",
  green: "text-emerald-600 dark:text-emerald-400",
  red: "text-red-600 dark:text-red-400",
  yellow: "text-yellow-600 dark:text-yellow-400",
  gray: "text-slate-600 dark:text-slate-400",
  cyan: "text-cyan-600 dark:text-cyan-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  slate: "text-slate-600 dark:text-slate-400",
} as const;

// Card/Container combinations
export const containers = {
  card: "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
  cardHover: "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg dark:hover:shadow-slate-900/20",
  section: "bg-white dark:bg-slate-900",
  sectionAlt: "bg-slate-50 dark:bg-slate-800",
  
  // Feature cards with colored backgrounds
  featureOrange: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
  featureBlue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
  featureGreen: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
  featureEmerald: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
  featureRed: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
  featureYellow: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
  featureSlate: "bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800",
} as const;

// Skeleton/Loading states
export const skeletons = {
  background: "bg-slate-50 dark:bg-slate-900",
 element: "bg-slate-200 dark:bg-slate-700",
  card: "bg-white dark:bg-slate-800",
} as const;

// Input/Form elements
export const inputs = {
  base: "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400",
  focus: "focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20",
} as const;

// Utility function to combine theme classes
export function themeClasses(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Utility function to get theme-aware classes based on color
export function getThemeColors(color: keyof typeof badges) {
  return {
    badge: badges[color],
    icon: iconColors[color as keyof typeof iconColors] || iconColors.gray,
    border: borders[color as keyof typeof borders] || borders.primary,
    container: (containers as any)[`feature${color.charAt(0).toUpperCase() + color.slice(1)}`] || containers.card,
  };
}

// Common component theme combinations
export const componentThemes = {
  // Hero section
  hero: {
    background: backgrounds.gradientEmerald,
    title: textColors.heading,
    subtitle: textColors.secondary,
    badge: badges.emerald,
  },
  
  // Stats section
  stats: {
    background: backgrounds.secondary,
    card: containers.card,
    title: textColors.heading,
    value: textColors.primary,
    description: textColors.tertiary,
  },
  
  // Treatment cards
  treatment: {
    background: backgrounds.primary,
    card: containers.cardHover,
    title: textColors.heading,
    description: textColors.secondary,
    badge: badges.gray,
  },
  
  // Testimonials
  testimonial: {
    background: backgrounds.primary,
    card: containers.card,
    text: textColors.secondary,
    author: textColors.primary,
    role: textColors.tertiary,
  },
  
  // Footer
  footer: {
    background: "bg-slate-900 dark:bg-black",
    text: "text-slate-300 dark:text-slate-400",
    heading: "text-white dark:text-slate-100",
    link: "text-slate-300 hover:text-white dark:text-slate-400 dark:hover:text-slate-200",
  },
} as const;

// Export all theme utilities
export const theme = {
  backgrounds,
  textColors,
  borders,
  badges,
  iconColors,
  containers,
  skeletons,
  inputs,
  componentThemes,
  themeClasses,
  getThemeColors,
} as const;

export default theme;
