/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      // Custom mobile breakpoints
      'mobile': {'max': '767px'},
      'tablet': {'min': '768px', 'max': '1023px'},
      'desktop': {'min': '1024px'},
      // Touch device detection
      'touch': {'raw': '(hover: none) and (pointer: coarse)'},
      'no-touch': {'raw': '(hover: hover) and (pointer: fine)'},
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-titillium)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // FantaF1 brand colors - Formula 1 Palette
        'f1-red': '#E10600',
        'f1-red-hover': '#B91C1C',
        'f1-dark': '#15151e',
        'f1-darker': '#101014',
        'f1-carbon': '#15151e',
        'f1-silver': '#D1D5DB',
        'f1-gray': '#38383f',
        'f1-light-gray': '#9ca3af',

        // Night Race Premium - Accent Colors
        'accent-gold': 'var(--accent-gold)',
        'accent-silver': 'var(--accent-silver)',
        'accent-bronze': 'var(--accent-bronze)',
        'accent-green': 'var(--accent-green)',
        'accent-amber': 'var(--accent-amber)',
        'accent-cyan': 'var(--accent-cyan)',

        // Surface Hierarchy
        'surface-0': 'var(--surface-0)',
        'surface-1': 'var(--surface-1)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
        'surface-4': 'var(--surface-4)',

        // Semantic colors for theming
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },
      backgroundImage: {
        'carbon-pattern': "radial-gradient(#282830 1px, transparent 1px)",
        'f1-gradient': 'linear-gradient(135deg, #E10600 0%, #B91C1C 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(225, 6, 0, 0.5)',
        'glow-green': '0 0 15px rgba(34, 197, 94, 0.3)',
        'glow-gold': '0 0 20px rgba(255, 215, 0, 0.3)',
        'glow-cyan': '0 0 15px rgba(6, 182, 212, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'elevation-1': '0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.15)',
        'elevation-2': '0 3px 6px rgba(0, 0, 0, 0.3), 0 3px 6px rgba(0, 0, 0, 0.2)',
        'elevation-3': '0 10px 20px rgba(0, 0, 0, 0.35), 0 6px 6px rgba(0, 0, 0, 0.2)',
        'elevation-4': '0 14px 28px rgba(0, 0, 0, 0.4), 0 10px 10px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 0 20px rgba(225, 6, 0, 0.3), 0 10px 20px rgba(0, 0, 0, 0.35)',
      },
      spacing: {
        // Touch-friendly spacing
        'touch': '44px',
        'touch-sm': '40px',
        'touch-lg': '48px',
      },
      fontSize: {
        // Mobile-optimized font sizes
        'mobile-xs': ['12px', '16px'],
        'mobile-sm': ['14px', '20px'],
        'mobile-base': ['16px', '24px'],
        'mobile-lg': ['18px', '28px'],
        'mobile-xl': ['20px', '32px'],
        // Typography Scale
        'display': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '900' }],
        'display-sm': ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '800' }],
        'heading': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '700' }],
        'heading-sm': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'label': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.05em', fontWeight: '600' }],
        'data': ['1.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'data-sm': ['1.125rem', { lineHeight: '1.2', fontWeight: '600' }],
      },
      minHeight: {
        'touch': '44px',
        'touch-sm': '40px',
        'touch-lg': '48px',
      },
      minWidth: {
        'touch': '44px',
        'touch-sm': '40px',
        'touch-lg': '48px',
      },
      animation: {
        'pulse-urgent': 'pulse-urgent 2s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'slide-in-up': 'slide-in-up 0.3s ease-out',
        'slide-in-down': 'slide-in-down 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'countdown-pulse': 'countdown-pulse 1s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        'pulse-urgent': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(225, 6, 0, 0.4)' },
          '50%': { opacity: '0.9', boxShadow: '0 0 20px 4px rgba(225, 6, 0, 0.6)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(225, 6, 0, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(225, 6, 0, 0.6)' },
        },
        'slide-in-up': {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-down': {
          from: { transform: 'translateY(-20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        'countdown-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [],
};
