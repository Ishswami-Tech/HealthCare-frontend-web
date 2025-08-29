// Enhanced Design System for Healthcare Application
export const designTokens = {
  // Color Palette - Medical & Ayurveda Inspired
  colors: {
    // Primary Healthcare Colors
    primary: {
      50: 'hsl(210, 100%, 98%)',
      100: 'hsl(210, 100%, 95%)',
      200: 'hsl(210, 100%, 90%)',
      300: 'hsl(210, 100%, 80%)',
      400: 'hsl(210, 100%, 70%)',
      500: 'hsl(210, 100%, 60%)', // Main primary
      600: 'hsl(210, 100%, 50%)',
      700: 'hsl(210, 100%, 40%)',
      800: 'hsl(210, 100%, 30%)',
      900: 'hsl(210, 100%, 20%)',
      950: 'hsl(210, 100%, 10%)',
    },
    
    // Ayurveda Green - Natural & Healing
    ayurveda: {
      50: 'hsl(120, 60%, 97%)',
      100: 'hsl(120, 60%, 94%)',
      200: 'hsl(120, 60%, 87%)',
      300: 'hsl(120, 60%, 75%)',
      400: 'hsl(120, 60%, 65%)',
      500: 'hsl(120, 60%, 50%)', // Main ayurveda green
      600: 'hsl(120, 60%, 40%)',
      700: 'hsl(120, 60%, 35%)',
      800: 'hsl(120, 60%, 25%)',
      900: 'hsl(120, 60%, 15%)',
    },

    // Medical Status Colors
    success: {
      50: 'hsl(142, 76%, 96%)',
      100: 'hsl(142, 76%, 91%)',
      200: 'hsl(142, 76%, 81%)',
      300: 'hsl(142, 76%, 69%)',
      400: 'hsl(142, 76%, 55%)',
      500: 'hsl(142, 76%, 45%)',
      600: 'hsl(142, 76%, 36%)',
      700: 'hsl(142, 76%, 28%)',
      800: 'hsl(142, 76%, 23%)',
      900: 'hsl(142, 76%, 19%)',
    },

    warning: {
      50: 'hsl(48, 96%, 95%)',
      100: 'hsl(48, 96%, 89%)',
      200: 'hsl(48, 96%, 76%)',
      300: 'hsl(48, 96%, 64%)',
      400: 'hsl(48, 96%, 53%)',
      500: 'hsl(48, 96%, 47%)',
      600: 'hsl(48, 96%, 39%)',
      700: 'hsl(48, 96%, 30%)',
      800: 'hsl(48, 96%, 25%)',
      900: 'hsl(48, 96%, 20%)',
    },

    danger: {
      50: 'hsl(0, 84%, 97%)',
      100: 'hsl(0, 84%, 93%)',
      200: 'hsl(0, 84%, 86%)',
      300: 'hsl(0, 84%, 75%)',
      400: 'hsl(0, 84%, 64%)',
      500: 'hsl(0, 84%, 53%)',
      600: 'hsl(0, 84%, 47%)',
      700: 'hsl(0, 84%, 39%)',
      800: 'hsl(0, 84%, 32%)',
      900: 'hsl(0, 84%, 26%)',
    },

    // Neutral Grays
    gray: {
      50: 'hsl(210, 20%, 98%)',
      100: 'hsl(210, 20%, 95%)',
      200: 'hsl(210, 16%, 93%)',
      300: 'hsl(210, 14%, 89%)',
      400: 'hsl(210, 14%, 83%)',
      500: 'hsl(210, 11%, 71%)',
      600: 'hsl(210, 7%, 56%)',
      700: 'hsl(210, 9%, 31%)',
      800: 'hsl(210, 10%, 23%)',
      900: 'hsl(210, 11%, 15%)',
      950: 'hsl(210, 11%, 9%)',
    },

    // Dosha Colors (Ayurveda)
    vata: {
      50: 'hsl(200, 100%, 97%)',
      500: 'hsl(200, 100%, 50%)',
      600: 'hsl(200, 100%, 40%)',
    },
    pitta: {
      50: 'hsl(25, 100%, 97%)',
      500: 'hsl(25, 100%, 50%)',
      600: 'hsl(25, 100%, 40%)',
    },
    kapha: {
      50: 'hsl(120, 40%, 97%)',
      500: 'hsl(120, 40%, 45%)',
      600: 'hsl(120, 40%, 35%)',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
      '6xl': '3.75rem',  // 60px
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.6',
      loose: '1.8',
    },
  },

  // Spacing
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem', // 2px
    1: '0.25rem',    // 4px
    1.5: '0.375rem', // 6px
    2: '0.5rem',     // 8px
    2.5: '0.625rem', // 10px
    3: '0.75rem',    // 12px
    3.5: '0.875rem', // 14px
    4: '1rem',       // 16px
    5: '1.25rem',    // 20px
    6: '1.5rem',     // 24px
    7: '1.75rem',    // 28px
    8: '2rem',       // 32px
    9: '2.25rem',    // 36px
    10: '2.5rem',    // 40px
    11: '2.75rem',   // 44px
    12: '3rem',      // 48px
    14: '3.5rem',    // 56px
    16: '4rem',      // 64px
    20: '5rem',      // 80px
    24: '6rem',      // 96px
    28: '7rem',      // 112px
    32: '8rem',      // 128px
    36: '9rem',      // 144px
    40: '10rem',     // 160px
    44: '11rem',     // 176px
    48: '12rem',     // 192px
    52: '13rem',     // 208px
    56: '14rem',     // 224px
    60: '15rem',     // 240px
    64: '16rem',     // 256px
    72: '18rem',     // 288px
    80: '20rem',     // 320px
    96: '24rem',     // 384px
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Shadows
  boxShadow: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
    
    // Medical-specific shadows
    card: '0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.05)',
    cardHover: '0 8px 25px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.05)',
    modal: '0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)',
  },

  // Breakpoints
  screens: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-index
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },

  // Animation
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  // Healthcare-specific tokens
  medical: {
    priority: {
      low: 'hsl(142, 76%, 36%)', // success[500]
      normal: 'hsl(210, 100%, 60%)', // primary[500]
      high: 'hsl(38, 92%, 50%)', // warning[500]
      critical: 'hsl(0, 84%, 60%)', // danger[500]
    },
    status: {
      scheduled: 'hsl(220, 9%, 46%)', // gray[500]
      confirmed: 'hsl(210, 100%, 60%)', // primary[500]
      inProgress: 'hsl(38, 92%, 50%)', // warning[500]
      completed: 'hsl(142, 76%, 36%)', // success[500]
      cancelled: 'hsl(0, 84%, 60%)', // danger[500]
      waiting: 'hsl(38, 92%, 60%)', // warning[400]
    },
  },
} as const;

// Utility function to get color with opacity
export const withOpacity = (color: string, opacity: number) => {
  return `${color} / ${opacity}`;
};

// Theme variants
export const themes = {
  light: {
    background: designTokens.colors.gray[50],
    surface: 'white',
    primary: designTokens.colors.primary[600],
    onPrimary: 'white',
    text: designTokens.colors.gray[900],
    textMuted: designTokens.colors.gray[600],
    border: designTokens.colors.gray[200],
    shadow: designTokens.boxShadow.card,
  },
  dark: {
    background: designTokens.colors.gray[950],
    surface: designTokens.colors.gray[900],
    primary: designTokens.colors.primary[400],
    onPrimary: designTokens.colors.gray[950],
    text: designTokens.colors.gray[50],
    textMuted: designTokens.colors.gray[400],
    border: designTokens.colors.gray[800],
    shadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)',
  },
} as const;

export type Theme = typeof themes.light;
export type DesignTokens = typeof designTokens;