/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'fifa-green': '#1DB954',
        'fifa-dark': '#121212',
        'fifa-black': '#0a0a0a',
        'fifa-neon': '#39FF14',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        'shake-fire': {
          '0%, 100%': { transform: 'translateX(0) scale(1.25)' },
          '25%': { transform: 'translateX(-2px) scale(1.25) rotate(-2deg)' },
          '75%': { transform: 'translateX(2px) scale(1.25) rotate(2deg)' }
        }
      },
      animation: {
        'shake-fire': 'shake-fire 0.2s cubic-bezier(.36,.07,.19,.97) infinite',
        'float-up': 'float-up 0.3s ease-out forwards',
        'float-down': 'float-down 0.3s ease-out forwards',
      }
    },
  },
  plugins: [],
}
