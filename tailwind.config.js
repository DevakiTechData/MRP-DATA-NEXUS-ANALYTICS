/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sluBlue: '#002F6C',
        sluGold: '#FDB515'
      }
    },
  },
  plugins: [],
}
