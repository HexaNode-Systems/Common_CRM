export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)'
      },
      borderRadius: {
        theme: 'var(--radius-theme)'
      },
      fontFamily: {
        theme: 'var(--font-family)'
      }
    }
  },
  plugins: []
};

