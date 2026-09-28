import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { SitemapStream, streamToPromise } from 'sitemap';
import { queryCollection } from '@nuxt/content/server';
import config from '~/config.json';

const BASE_URL = 'https://cyclopolis.fr';

export default defineEventHandler(async event => {
  const sitemap = new SitemapStream({ hostname: BASE_URL });
  // Seuls les articles de blog ont une page à leur propre chemin : news, limites, services et sites
  // partenaires sont affichés par d'autres pages, leur chemin de contenu n'est pas une URL du site.
  const blogArticles = await queryCollection(event, 'blog').all();
  for (const blogArticle of blogArticles) {
    sitemap.write({ url: blogArticle.path, changefreq: 'monthly' });
  }

  const voiesCyclablesPages = await queryCollection(event, 'voiesCyclablesPages').all();
  for (const voieCyclablePage of voiesCyclablesPages) {
    sitemap.write({ url: `/${config.slug}-${voieCyclablePage.line}`, changefreq: 'monthly' });
  }

  const staticEndpoints = getStaticEndpoints();
  for (const staticEndpoint of staticEndpoints) {
    sitemap.write({ url: staticEndpoint, changefreq: 'monthly' });
  }

  sitemap.end();
  return streamToPromise(sitemap);
});

function getStaticEndpoints(): string[] {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const files = getFiles(`${__dirname}/../../pages`);
  return files
    .filter(file => !file.includes('slug')) // exclude dynamic content
    .map(file => file.split('pages')[1])
    .map(file => {
      return file.endsWith('index.vue') ? file.split('/index.vue')[0] : file.split('.vue')[0];
    });
}

/**
 * recursively get all files from /pages folder
 */
function getFiles(dir: string): string[] {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const files = dirents.map(dirent => {
    const res = resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  });
  return files.flat();
}
