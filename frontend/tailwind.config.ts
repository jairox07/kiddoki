import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'oklch(97.5% 0.012 100)',
        cream: 'oklch(94% 0.025 95)',
        ink: 'oklch(26% 0.03 155)',
        pine: {
          DEFAULT: 'oklch(42% 0.09 158)',
          deep: 'oklch(32% 0.07 160)',
          soft: 'oklch(88% 0.05 155)',
        },
        coral: {
          DEFAULT: 'oklch(66% 0.17 38)',
          soft: 'oklch(92% 0.045 45)',
        },
        sun: {
          DEFAULT: 'oklch(84% 0.14 92)',
          soft: 'oklch(95% 0.06 95)',
        },
        lago: {
          DEFAULT: 'oklch(70% 0.1 235)',
          soft: 'oklch(92% 0.04 235)',
        },
        mist: 'oklch(60% 0.02 155)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        kid: ['var(--font-kid)'],
      },
      borderRadius: { blob: '2.5rem' },
      transitionTimingFunction: {
        'out-quint': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
