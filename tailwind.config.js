/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {
      colors: {
        'lvv-blue-600': '#429ada',
        'lvv-blue-500': '#55a4dd',
        'lvv-blue-400': '#7fbbe6',
        'lvv-blue-300': '#aad2ee',
        'lvv-blue-200': '#d4e8f7',
        'lvv-blue-100': '#e9f3fb',
        'lvv-pink': '#C84271',
        'lvv-green': '#83C0B7'
      },
      typography: {
        DEFAULT: {
          css: {
            a: { color: '#429ada' }
          }
        }
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
};
