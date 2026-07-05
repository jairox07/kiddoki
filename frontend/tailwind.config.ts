import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        kiwi: '#7BC950',
        sky: '#5AC8FA',
        sun: '#FFD166',
        berry: '#EF476F',
        forest: '#0B6E4F',
      },
      borderRadius: { blob: '2rem' },
    },
  },
  plugins: [],
} satisfies Config;
