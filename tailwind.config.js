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
        'lvv-green': '#83C0B7',

        'velocite-blue-1': '#99C1F1',
        'velocite-blue-2': '#62A0EA',
        'velocite-blue-3': '#3584E4',
        'velocite-blue-4': '#1C71D8',
        'velocite-blue-5': '#1A5FB4',
        'velocite-green-1': '#9CFFAF',
        'velocite-green-2': '#57E389',
        'velocite-green-3': '#33D17A',
        'velocite-green-4': '#2EC27E',
        'velocite-green-5': '#77dd77',
        'velocite-yellow-1': '#F9F06B',
        'velocite-yellow-2': '#F8E45C',
        'velocite-yellow-3': '#F6D32D',
        'velocite-yellow-4': '#F5C211',
        'velocite-yellow-5': '#E5A50A',
        'velocite-orange-1': '#FFBE6F',
        'velocite-orange-2': '#FFA348',
        'velocite-orange-3': '#FF7800',
        'velocite-orange-4': '#E66100',
        'velocite-orange-5': '#fafc74',
        'velocite-red-1': '#FFA3AF',
        'velocite-red-2': '#ED333B',
        'velocite-red-3': '#E01B24',
        'velocite-red-4': '#C01C28',
        'velocite-red-5': '#ff6961',
        'velocite-purple-1': '#DC8ADD',
        'velocite-purple-2': '#C061CB',
        'velocite-purple-3': '#9141AC',
        'velocite-purple-4': '#813D9C',
        'velocite-purple-5': '#613583',
        'velocite-brown-1': '#CDAB8F',
        'velocite-brown-2': '#B5835A',
        'velocite-brown-3': '#986A44',
        'velocite-brown-4': '#865E3C',
        'velocite-brown-5': '#63452C',
        'velocite-light-1': '#FFFFFF',
        'velocite-light-2': '#F6F5F4',
        'velocite-light-3': '#DEDDDA',
        'velocite-light-4': '#C0BFBC',
        'velocite-light-5': '#9A9996',
        'velocite-dark-1': '#77767B',
        'velocite-dark-2': '#5E5C64',
        'velocite-dark-3': '#3D3846',
        'velocite-dark-4': '#241F31',
        'velocite-dark-5': '#000000',
        'velocite-bidirectionnelle': "#b3c6ff", // bleu
        'velocite-bilaterale': "#b3fbff", // cyan
        'velocite-velorue': "#fffbb3", // jaune
        'velocite-voie-verte': "#b3ffb6", // vert
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
