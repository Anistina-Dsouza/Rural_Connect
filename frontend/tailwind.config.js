/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#004532",
        "on-primary": "#ffffff",
        "primary-container": "#065f46",
        "on-primary-container": "#8bd6b7",
        "primary-fixed": "#a6f2d1",
        "primary-fixed-dim": "#8bd6b6",
        "on-primary-fixed": "#002116",
        "on-primary-fixed-variant": "#00513b",
        "inverse-primary": "#8bd6b6",

        "secondary": "#904d00",
        "on-secondary": "#ffffff",
        "secondary-container": "#fe932c",
        "on-secondary-container": "#663500",
        "secondary-fixed": "#ffdcc3",
        "secondary-fixed-dim": "#ffb77d",
        "on-secondary-fixed": "#2f1500",
        "on-secondary-fixed-variant": "#6e3900",

        "tertiary": "#00443f",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#005e57",
        "on-tertiary-container": "#81d6cc",
        "tertiary-fixed": "#9cf2e8",
        "tertiary-fixed-dim": "#80d5cb",

        "surface": "#f9f9ff",
        "surface-dim": "#cfdaf2",
        "surface-bright": "#f9f9ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f0f3ff",
        "surface-container": "#e7eeff",
        "surface-container-high": "#dee8ff",
        "surface-container-highest": "#d8e3fb",
        "surface-variant": "#d8e3fb",

        "on-surface": "#111c2d",
        "on-surface-variant": "#3f4944",
        "inverse-surface": "#263143",
        "inverse-on-surface": "#ecf1ff",

        "outline": "#6f7973",
        "outline-variant": "#bec9c2",
        "surface-tint": "#1b6b51",

        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",

        // Retain brand compatibility for legacy components
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        urgency: {
          emergency: '#dc2626',
          consult: '#d97706',
          selfcare: '#065f46',
        }
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['"Public Sans"', 'sans-serif'],
        sans: ['"Public Sans"', 'Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
