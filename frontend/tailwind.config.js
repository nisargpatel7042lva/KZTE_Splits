/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: '#00B8A9',
          dark: '#00a089',
          light: '#1ac9ba',
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: '#F8B500',
          dark: '#e0a500',
          light: '#ffc933',
          foreground: "hsl(var(--secondary-foreground))",
        },
        success: '#06D6A0',
        error: '#EF476F',
        warning: '#FFB800',
        info: '#118AB2',
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
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
