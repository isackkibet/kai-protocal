/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0f7f4',
          100: '#dceee4',
          200: '#bce0cd',
          300: '#91ccad',
          400: '#61b187',
          500: '#3d9467',
          600: '#2c7651',
          700: '#255e42',
          800: '#204b36',
          900: '#1b3f2f',
          950: '#0b1c14',
        },
        gold: {
          400: '#e4c878',
          500: '#c89b3c',
          600: '#a87e2b',
        }
      },
    },
  },
  plugins: [],
};
