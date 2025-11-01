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
          DEFAULT: '#00B8A9',
          dark: '#00a089',
          light: '#1ac9ba',
        },
        secondary: {
          DEFAULT: '#F8B500',
          dark: '#e0a500',
          light: '#ffc933',
        },
        success: '#06D6A0',
        error: '#EF476F',
        warning: '#FFB800',
        info: '#118AB2',
        background: '#F7F9FC',
        surface: {
          DEFAULT: '#FFFFFF',
          hover: '#F5F7FA',
        },
        text: {
          primary: '#1A1A2E',
          secondary: '#6B7280',
          disabled: '#9CA3AF',
          'on-primary': '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
