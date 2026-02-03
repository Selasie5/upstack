/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        destructive: '#ef4444',
        background: '#ffffff',
        foreground: '#000000',
        muted: '#f3f4f6',
        'muted-foreground': '#6b7280',
        accent: '#f3f4f6',
        'accent-foreground': '#1f2937',
        border: '#e5e7eb',
        input: '#e5e7eb',
        ring: '#3b82f6',
      },
      spacing: {
        '45': '11.25rem',
        '70': '17.5rem',
        '112': '28rem',
        '137': '34.25rem',
        '62': '15.5rem',
      },
    },
  },
  plugins: [],
}

