/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  darkMode: 'class',           // ← THIS IS THE IMPORTANT LINE
  theme: {
    extend: {},
  },
  plugins: [],
}