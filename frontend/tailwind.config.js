/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary
        'brand-black': '#0A0A0A',
        'brand-gold': '#D4AF37',
        
        // Surfaces
        'surface-dark': '#1A1A1A',
        'surface-card': '#2A2A2A',
        
        // Text
        'text-primary': '#FFFFFF',
        'text-secondary': '#A0A0A0',
        'text-muted': '#6B6B6B',
        
        // Neutral
        'neutral-warm': '#F5F5F0',
        'neutral-border': '#3A3A3A',
      },
    },
  },
  plugins: [],
}