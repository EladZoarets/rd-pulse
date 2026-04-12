import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        health: {
          good:    '#16a34a',
          at_risk: '#d97706',
          critical:'#dc2626',
        },
        severity: {
          high:   '#dc2626',
          medium: '#d97706',
          low:    '#2563eb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
