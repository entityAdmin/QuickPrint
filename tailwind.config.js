/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#0A5CFF',
        'brand-secondary': '#3B8CFF',
        'brand-tertiary': '#E6EFFF',
        'app-background': '#F5F9FF',
        'surface-primary': '#FFFFFF',
        'text-primary': '#0F1A2B',
        'text-secondary': '#66758F',
        'text-muted': '#8FA1C1',
        'status-success': '#22C55E',
        'status-warning': '#F59E0B',
        'status-error': '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'input': '12px',
        'button': '14px',
        'card': '18px',
      },
      spacing: {
        '24': '24px',
        '32': '32px',
        '12': '12px',
        '16': '16px',
        '20': '20px',
      },
      boxShadow: {
        'card': '0px 4px 24px rgba(15, 26, 43, 0.06)',
      },
      lineHeight: {
        'heading': '1.2',
        'section-title': '1.4',
        'body': '1.6',
      },
      gradientColorStops: {
        'primary-gradient-start': '#0A5CFF',
        'primary-gradient-end': '#3B8CFF',
      }
    },
  },
  plugins: [],
}
