/**
 * Theme utilities for consistent light/dark mode styling
 * Provides pre-defined class combinations for common UI patterns
 */

// Background colors with dark mode variants
export const backgrounds = {
  // Primary backgrounds
  primary: "bg-white dark:bg-gray-900",
  secondary: "bg-gray-50 dark:bg-gray-800",
  tertiary: "bg-gray-100 dark:bg-gray-700",
  
  // Card backgrounds
  card: "bg-white dark:bg-gray-800",
  cardSecondary: "bg-gray-50 dark:bg-gray-900",
  
  // Gradient backgrounds
  gradientOrange: "bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-orange-900/10",
  gradientBlue: "bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/10",
  gradientPurple: "bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/10",
  
  // Ayurveda specific gradients
  ayurvedaHero: "bg-gradient-to-br from-gray-50 via-white to-orange-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-orange-900/10",
} as const;

// Text colors with dark mode variants
export const textColors = {
  // Primary text
  primary: "text-gray-900 dark:text-white",
  secondary: "text-gray-700 dark:text-gray-300",
  tertiary: "text-gray-600 dark:text-gray-400",
  muted: "text-gray-500 dark:text-gray-500",
  
  // Headings
  heading: "text-gray-900 dark:text-white",
  subheading: "text-gray-700 dark:text-gray-300",
  
  // Special text
  success: "text-green-600 dark:text-green-400",
  warning: "text-orange-600 dark:text-orange-400",
  error: "text-red-600 dark:text-red-400",
  info: "text-blue-600 dark:text-blue-400",
} as const;

// Border colors with dark mode variants
export const borders = {
  primary: "border-gray-200 dark:border-gray-700",
  secondary: "border-gray-300 dark:border-gray-600",
  light: "border-gray-100 dark:border-gray-800",
  
  // Colored borders
  orange: "border-orange-200 dark:border-orange-800",
  blue: "border-blue-200 dark:border-blue-800",
  green: "border-green-200 dark:border-green-800",
  purple: "border-purple-200 dark:border-purple-800",
  red: "border-red-200 dark:border-red-800",
  yellow: "border-yellow-200 dark:border-yellow-800",
} as const;

// Badge/Chip color combinations
export const badges = {
  orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800",
  blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800",
  green: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800",
  purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800",
  red: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800",
  yellow: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800",
  gray: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700",
  cyan: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800",
  emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800",
  indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800",
} as const;

// Icon colors with dark mode variants
export const iconColors = {
  orange: "text-orange-600 dark:text-orange-400",
  blue: "text-blue-600 dark:text-blue-400",
  green: "text-green-600 dark:text-green-400",
  purple: "text-purple-600 dark:text-purple-400",
  red: "text-red-600 dark:text-red-400",
  yellow: "text-yellow-600 dark:text-yellow-400",
  gray: "text-gray-600 dark:text-gray-400",
  cyan: "text-cyan-600 dark:text-cyan-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
} as const;

// Card/Container combinations
export const containers = {
  card: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
  cardHover: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-gray-900/20",
  section: "bg-white dark:bg-gray-900",
  sectionAlt: "bg-gray-50 dark:bg-gray-800",
  
  // Feature cards with colored backgrounds
  featureOrange: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
  featureBlue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
  featureGreen: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
  featurePurple: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
  featureRed: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
  featureYellow: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
} as const;

// Skeleton/Loading states
export const skeletons = {
  background: "bg-gray-50 dark:bg-gray-900",
  element: "bg-gray-200 dark:bg-gray-700",
  card: "bg-white dark:bg-gray-800",
} as const;

// Input/Form elements
export const inputs = {
  base: "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400",
  focus: "focus:border-orange-500 dark:focus:border-orange-400 focus:ring-orange-500/20 dark:focus:ring-orange-400/20",
} as const;

// Utility function to combine theme classes
export function themeClasses(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Utility function to get theme-aware classes based on color
export function getThemeColors(color: keyof typeof badges) {
  return {
    badge: badges[color],
    icon: iconColors[color],
    border: borders[color as keyof typeof borders] || borders.primary,
    container: containers[`feature${color.charAt(0).toUpperCase() + color.slice(1)}` as keyof typeof containers] || containers.card,
  };
}

// Common component theme combinations
export const componentThemes = {
  // Hero section
  hero: {
    background: backgrounds.gradientOrange,
    title: textColors.heading,
    subtitle: textColors.secondary,
    badge: badges.orange,
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
    background: "bg-gray-900 dark:bg-black",
    text: "text-gray-300 dark:text-gray-400",
    heading: "text-white dark:text-gray-100",
    link: "text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-gray-200",
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
