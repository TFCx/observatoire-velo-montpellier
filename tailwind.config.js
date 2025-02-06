/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {
      colors: {

        // Generate tones with https://gradients.app/en/shades/
        'color-primary-exact': '#FFDC4E',

        'color-primary-primary': '#E5A50A',

        'color-primary-900': '#221801',
        'color-primary-800': '#523B04',
        'color-primary-700': '#835F06',
        'color-primary-600': '#B48208',
        'color-primary-500': '#E5A50A',
        'color-primary-400': '#F6BB2C',
        'color-primary-300': '#F8CB5D',
        'color-primary-200': '#FADA8E',
        'color-primary-100': '#FCEABF',
        'color-primary-50' : '#FDF2D7',

        'color-primary-600': '#B48208',
        'color-primary-500': '#E5A50A',
        'color-primary-400': '#F6BB2C',
        'color-primary-300': '#F8CB5D',
        'color-primary-200': '#FADA8E',
        'color-primary-100': '#FCEABF',

        'color-secondary': '#C84271',

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