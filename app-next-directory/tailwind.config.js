/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#10B981',
          dark: '#059669',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          50: '#ecfdf5',
          100: '#d0fae5',
          200: '#a4f4cf',
          300: '#5ee9b5',
          400: '#00d492',
          500: '#00bc7d',
          600: '#009966',
          700: '#007a55',
          800: '#006045',
          900: '#004f3b',
          950: '#002c22',
          DEFAULT: '#00bc7d',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            color: 'hsl(var(--foreground))',
            h1: { color: 'hsl(var(--foreground))' },
            h2: { color: 'hsl(var(--foreground))' },
            h3: { color: 'hsl(var(--foreground))' },
            h4: { color: 'hsl(var(--foreground))' },
            h5: { color: 'hsl(var(--foreground))' },
            h6: { color: 'hsl(var(--foreground))' },
            code: { color: 'hsl(var(--foreground))' },
            pre: { color: 'hsl(var(--foreground))' },
            blockquote: { color: 'hsl(var(--muted-foreground))' },
            a: {
              color: theme('colors.primary.DEFAULT'),
              '&:hover': {
                color: theme('colors.primary.foreground'),
              },
            },
          },
        },
        invert: {
          css: {
            color: 'hsl(var(--foreground))',
            h1: { color: 'hsl(var(--foreground))' },
            h2: { color: 'hsl(var(--foreground))' },
            h3: { color: 'hsl(var(--foreground))' },
            h4: { color: 'hsl(var(--foreground))' },
            h5: { color: 'hsl(var(--foreground))' },
            h6: { color: 'hsl(var(--foreground))' },
            code: { color: 'hsl(var(--foreground))' },
            pre: { color: 'hsl(var(--foreground))' },
            blockquote: { color: 'hsl(var(--muted-foreground))' },
            a: {
              color: theme('colors.primary.DEFAULT'),
              '&:hover': {
                color: theme('colors.primary.foreground'),
              },
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/forms')({ strategy: 'class' }),
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp'),
  ],
};
