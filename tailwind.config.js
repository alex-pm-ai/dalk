/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0a09',
        foreground: '#f4f6f2',
        primary: '#bcc829',
        'primary-foreground': '#121606',
        card: '#121311',
        'card-border': 'rgba(255,255,255,0.09)',
        muted: '#1c1d1b',
        'muted-foreground': '#9a9c97',
      },
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

