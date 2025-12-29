/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#0A5CFF',
          50: '#E6EFFF',
          100: '#CCE0FF',
          200: '#99C1FF',
          300: '#66A3FF',
          400: '#3B8CFF',
          500: '#0A5CFF',
          600: '#094CE6',
          700: '#073DBF',
          800: '#052E99',
          900: '#041F73',
        },
        secondary: '#66758F',
        muted: '#8FA1C1',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        background: '#F5F9FF',
        surface: '#FFFFFF',
        text: {
          primary: '#0F1A2B',
          secondary: '#66758F',
          muted: '#8FA1C1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
      },
      borderRadius: {
        input: '12px',
        button: '14px',
        card: '18px',
      },
      spacing: {
        12: '12px',
        16: '16px',
        20: '20px',
        24: '24px',
        32: '32px',
      },
      boxShadow: {
        card: '0px 4px 24px rgba(15, 26, 43, 0.06)',
      },
      lineHeight: {
        heading: '1.2',
        section: '1.3',
        body: '1.5',
        helper: '1.4',
      },
    },
  },
  plugins: [],
}