/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {
      colors: {

        // A virer
        'velocite-yellow-5': '#E5A50A',
        'lvv-blue-600': '#152B68',
        'lvv-blue-500': '#433E61',
        'lvv-blue-400': '#665E7B',
        'lvv-blue-300': '#C2BDC3',
        'lvv-blue-200': '#DEDBDD',
        'lvv-blue-100': '#EFEDF1',
        'lvv-pink': '#C84271',

        'stats-already-existing': '#000000',
        'stats-done': '#E5A50A',
        'stats-wip': '#665E7B',
        'stats-planned': '#CDAB8F',
        'stats-postponed': '#C84271',

        'legend-quality-good': '#77dd77',
        'legend-quality-fair': '#fafc74',
        'legend-quality-bad': '#ff6961',
        'legend-infra-family-mix-motor': "#f797e7",
        'legend-infra-family-mix-ped': "#e6ffb3",
        'legend-infra-family-dedie': "#b3c6ff",
        'legend-infra-type-bidirectionnelle': "#b3c6ff",
        'legend-infra-type-bilaterale': "#b3fbff",
        'legend-infra-type-velorue': "#fffbb3",
        'legend-infra-type-voie-verte': "#b3ffb6",
      },
      typography: {
        DEFAULT: {
          css: {
            a: { color: '#152B68' }
          }
        }
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
};