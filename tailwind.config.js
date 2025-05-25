/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // FantaF1 brand colors
        'f1-red': '#E10600',
        'f1-dark': '#1C1C1C',
        'f1-silver': '#C0C0C0',
      },
    },
  },
  plugins: [],
};
