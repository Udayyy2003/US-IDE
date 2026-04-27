/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // US-IDE Design System
        bg: {
          primary: '#0a0a0f',
          secondary: '#111118',
          tertiary: '#1a1a24',
          panel: '#13131d',
          hover: '#1e1e2e',
          active: '#252535',
        },
        accent: {
          primary: '#7c6df5',
          secondary: '#5b4ed8',
          glow: '#9d8fff',
          cyan: '#00d4ff',
          green: '#00ff94',
          red: '#ff4d6d',
          orange: '#ff9500',
          yellow: '#ffd60a',
        },
        border: {
          subtle: '#1f1f2e',
          default: '#2a2a3d',
          active: '#7c6df5',
        },
        text: {
          primary: '#e8e8f0',
          secondary: '#8888a8',
          muted: '#555570',
          accent: '#9d8fff',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        slideUp: {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 }
        },
        glow: {
          from: { boxShadow: '0 0 10px rgba(124, 109, 245, 0.3)' },
          to: { boxShadow: '0 0 20px rgba(124, 109, 245, 0.6)' }
        }
      }
    },
  },
  plugins: [],
}
