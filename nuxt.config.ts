import config from './config.json';
import { formatBuildInfo, readBuildInfo } from './build-info';

const TITLE = `Observatoire Vélo de Montpellier - Suivi des ${config.revName.plural} par ${config.assoName}`;
const DESCRIPTION =
  `Plateforme citoyenne et associative, par ${config.assoName}. État d'avancement, cartes interactives des itinéraires, détails, travaux : suivez le développement du réseau cyclable sécurisé montpelliérain`;
const BUILD_INFO = readBuildInfo();
const COVER_IMAGE_URL = 'https://observatoire-velo-montpellier.netlify.app/_nuxt/logoCyclopolisVGM.CzJjkGQi.png';

export default defineNuxtConfig({
  // Code applicatif à la racine plutôt que dans app/ (ADR 0003).
  srcDir: '.',

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: TITLE,
      meta: [
        { name: 'description', content: DESCRIPTION },
        // Commit, environnement et date du build : vérifiable sur toutes les pages, y compris en prod.
        { name: 'observatoire-build', content: formatBuildInfo(BUILD_INFO) },
        // facebook
        { property: 'og:site_name', content: TITLE },
        { property: 'og:type', content: 'website' },
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
        { name: 'twitter:title', content: TITLE },
        {
          name: 'twitter:description',
          content: DESCRIPTION
        },
        { name: 'twitter:image', content: COVER_IMAGE_URL }
      ]
    }
  },

  runtimeConfig: {
    public: {
      maptilerKey: process.env.MAPTILER_KEY,
      build: BUILD_INFO
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

  compatibilityDate: '2026-09-28'
});
