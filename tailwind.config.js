/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Here we add our custom theme properties
      fontFamily: {
        sans: ['Tajawal', 'sans-serif'], // Set Tajawal as the default font
      },
      colors: {
        'background-dark': '#0a0a0f',
        'surface-dark': 'rgba(22, 27, 34, 0.6)',
        'primary-blue': '#388bfd',
        'primary-purple': '#8A2BE2',
        'text-primary': '#f0f6fc',
        'text-secondary': '#8b949e',
        'border-color': 'rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'glow': 'move-glow 25s infinite alternate ease-in-out',
      },
      keyframes: {
        'move-glow': {
          'from': { transform: 'translate(-20%, 10%) scale(1)' },
          'to': { transform: 'translate(20%, -10%) scale(1.2)' },
        }
      }
    },
  },
  plugins: [],
};