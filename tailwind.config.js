/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body:    ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      colors: {
        sage: {
          50:  '#f4f7f4',
          100: '#e6ede6',
          200: '#ccdbcc',
          300: '#a5bfa5',
          400: '#779977',
          500: '#557a55',
          600: '#406140',
          700: '#354f35',
          800: '#2b402b',
          900: '#243424',
          950: '#111c11',
        },
        sand: {
          50:  '#faf8f4',
          100: '#f3efe5',
          200: '#e6deca',
          300: '#d4c9a8',
          400: '#bfae83',
          500: '#a99160',
          600: '#8f7549',
          700: '#745e3b',
          800: '#5e4d32',
          900: '#4d3f2b',
        },
        slate: {
          950: '#0a0f0a',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-up':    'fadeUp 0.5s ease forwards',
        'fade-in':    'fadeIn 0.3s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
