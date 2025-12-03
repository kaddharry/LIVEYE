/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          blue: '#00BFFF',
          dark: '#0099CC',
          light: '#33CCFF',
        },
      },
      boxShadow: {
        'neon': '0 0 10px #00BFFF, 0 0 20px #00BFFF, 0 0 30px #00BFFF',
        'neon-sm': '0 0 5px #00BFFF, 0 0 10px #00BFFF',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #00BFFF, 0 0 10px #00BFFF' },
          '100%': { boxShadow: '0 0 10px #00BFFF, 0 0 20px #00BFFF, 0 0 30px #00BFFF' },
        },
      },
    },
  },
  plugins: [],
}
