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
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
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
    },
  },
  plugins: [],
};
