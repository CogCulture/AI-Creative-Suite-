/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#000000',
        'brand-fg': '#ffffff',
        ink: '#16192b',
        surface: '#f7f8fa',
        'surface-alt': '#dddddd',
        border: '#e6e8ee',
        muted: '#6b7080',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
