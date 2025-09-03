/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Legal Profesional
        'navy': {
          DEFAULT: '#1E2A38',  // Azul Marino Profesional
          50: '#f1f3f6',
          100: '#e2e7ed',
          200: '#c6cfd9',
          300: '#a0afc2',
          400: '#748ba6',
          500: '#576b85',
          600: '#4a5a70',
          700: '#3e4a5b',
          800: '#2f3a46',
          900: '#1E2A38',
        },
        'royal': {
          DEFAULT: '#004AAD',  // Azul Real Brillante
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#0066ff',
          600: '#004AAD',
          700: '#003d8a',
          800: '#002f66',
          900: '#002243',
        },
        'steel': {
          DEFAULT: '#E5E7EB',  // Gris Acero Claro
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#E5E7EB',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        'gold': {
          DEFAULT: '#D4AF37',  // Dorado Cálido
          50: '#fdfbf4',
          100: '#faf6e8',
          200: '#f2eacc',
          300: '#e8d9a6',
          400: '#dcc477',
          500: '#D4AF37',
          600: '#c19b2b',
          700: '#a1821f',
          800: '#826717',
          900: '#6b5512',
        },
        'legal-red': {
          DEFAULT: '#C53030',  // Rojo Legal Suave
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#C53030',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Shortcuts para facilidad
        primary: '#1E2A38',      // navy
        secondary: '#004AAD',    // royal  
        accent: '#D4AF37',       // gold
        neutral: '#E5E7EB',      // steel
        danger: '#C53030',       // legal-red
        white: '#FFFFFF',
      },
      fontFamily: {
        'heading': ['Inter', 'system-ui', 'sans-serif'],
        'body': ['Nunito', 'system-ui', 'sans-serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.5s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'bounce-subtle': 'bounce 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
} 