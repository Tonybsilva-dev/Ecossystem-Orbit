import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        serif: ['Playfair Display', ...defaultTheme.fontFamily.serif],
      },
      colors: {
        shop: {
          900: '#0f172a', // Slate-900 (Deep Navy)
          800: '#1e293b',
          700: '#334155',
        },
        leather: {
          700: '#b45309', // Amber-700 (Saddle Leather)
          800: '#92400e',
        },
        chrome: {
          100: '#f1f5f9', // Slate-100 (Metallic Silver/White)
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8', // Metallic
        },
        gold: {
          500: '#d97706', // Amber-600/500ish for accents
        },
      },
      backgroundImage: {
        noise:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
} satisfies Config;
