import config from './config.json';

const TITLE = `Observatoire Vélo de Montpellier - Suivi des ${config.revName.plural} par ${config.assoName}`;
const DESCRIPTION =
  `Plateforme citoyenne et associative, par ${config.assoName}. État d'avancement, cartes interactives des itinéraires, détails, travaux : suivez le développement du réseau cyclable sécurisé montpelliérain`;
const BASE_URL = 'https://velocite-montpellier.fr';
const COVER_IMAGE_URL = 'https://observatoire-velo-montpellier.netlify.app/_nuxt/logoCyclopolisVGM.CzJjkGQi.png';

export default defineNuxtConfig({
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: TITLE,
      meta: [
        { name: 'description', content: DESCRIPTION },
        // facebook
        { property: 'og:site_name', content: TITLE },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: BASE_URL },
        { property: 'og:title', content: TITLE },
        {
          property: 'og:description',
          content: DESCRIPTION
        },
        { property: 'og:image', content: COVER_IMAGE_URL },
        { property: 'og:image:width', content: '640' },
        { property: 'og:image:height', content: '476' },
        // twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:url', content: BASE_URL },
        { name: 'twitter:title', content: TITLE },
        {
          name: 'twitter:description',
          content: DESCRIPTION
        },
        { name: 'twitter:image', content: COVER_IMAGE_URL }
      ],
      script: [
        {
          src: 'https://beamanalytics.b-cdn.net/beam.min.js',
          'data-token': process.env.BEAM_ANALYTICS_TOKEN,
          async: true
        }
      ]
    }
  },

  runtimeConfig: {
    public: {
      maptilerKey: process.env.MAPTILER_KEY
    }
  },

  modules: ['@nuxtjs/tailwindcss', '@nuxt/content', '@nuxt/icon', '@nuxtjs/sitemap'],

  site: {
    url: config.siteUrl
  },

  sitemap: {
    // Page d'erreur et carte à intégrer dans d'autres sites : générées, mais pas à indexer.
    exclude: ['/404', '/carte-interactive/embed']
  },

  content: {
    renderer: {
      alias: { h1: 'h1', h5: 'h5', h6: 'h6' }
    },
    experimental: {
      // SQLite intégré à Node >= 22.5 : évite d'ajouter better-sqlite3, seulement utile au build.
      sqliteConnector: 'native'
    }
  },

  icon: {
    customCollections: [
      {
        prefix: 'cyclopolis',
        dir: './assets/icons'
      }
    ]
  },

  tailwindcss: { viewer: false },

  build: {
    transpile: ['@headlessui/vue']
  },

  compatibilityDate: '2024-08-11'
});
