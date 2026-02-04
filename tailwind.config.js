/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060d18',
          900: '#0b1526',
          800: '#0f1d33',
          700: '#152742',
          600: '#1c3254',
          500: '#243d66',
          400: '#3a5a8a',
          300: '#5a7eb0',
          200: '#8aa8d0',
          100: '#bdd0ea',
        },
        accent: {
          DEFAULT: '#e8842a',
          hover: '#f59640',
          dark: '#c96f1f',
          light: '#fbb97a',
        },
      },
      fontFamily: {
        display: ['"Outfit"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
