// Smoke tests du site statique : vérifient que `nuxt generate` a produit chaque page attendue,
// sans page d'erreur, avec son contenu clé. Ils lisent .output/public : lancer `npm run test:smoke`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assert, describe, it } from 'vitest';

import config from '../../config.json';
import {
  BLOG_DIRECTORY,
  VOIES_CYCLABLES_DIRECTORY,
  convertTitleToAnchor,
  readFrontmatterValue,
  readMarkdownFiles,
  readMarkdownTitles
} from '../helpers/content';

const GENERATED_SITE_DIRECTORY = fileURLToPath(new URL('../../.output/public', import.meta.url));

// Texte propre à la page d'erreur (pages/404.vue) : s'il apparaît ailleurs, la page a échoué.
const ERROR_PAGE_TEXT = 'sortie de piste';

// Pages sans texte clé : leur contenu (carte, graphiques) n'est dessiné que dans le navigateur.
const CLIENT_RENDERED_ROUTES = ['/carte-interactive/embed', '/evolution', '/services'];

const KEY_TEXT_BY_STATIC_ROUTE: Record<string, string> = {
  '/': 'Avancement des',
  '/blog': "Blog de l'observatoire",
  '/historique': 'Historique des changements',
  '/mentions-legales': 'Mentions légales',
  '/sites-partenaires': 'Sites partenaires',
  '/tableau-de-bord': 'Tableau de bord de suivi des Vélolignes',
  '/carte-interactive': 'Carte à jour des Vélolignes',
  '/plan-officiel': 'Plan des Vélolignes'
};

type LinePage = { route: string; lineName: string; titles: string[] };
type BlogPostPage = { route: string; title: string };

const linePages: LinePage[] = readMarkdownFiles(VOIES_CYCLABLES_DIRECTORY).map(({ content }) => ({
  route: `/${config.slug}-${readFrontmatterValue(content, 'line')}`,
  lineName: readFrontmatterValue(content, 'lineName') ?? '',
  titles: readMarkdownTitles(content)
}));

const blogPostPages: BlogPostPage[] = readMarkdownFiles(BLOG_DIRECTORY).map(({ fileName, content }) => ({
  route: `/blog/${fileName.replace(/\.md$/, '')}`,
  title: readFrontmatterValue(content, 'title') ?? ''
}));

const allExpectedRoutes = [
  ...Object.keys(KEY_TEXT_BY_STATIC_ROUTE),
  ...CLIENT_RENDERED_ROUTES,
  ...linePages.map(page => page.route),
  ...blogPostPages.map(page => page.route)
];

function getGeneratedPagePath(route: string): string {
  return path.join(GENERATED_SITE_DIRECTORY, route, 'index.html');
}

// Le HTML généré encode certains caractères (&#x27; pour ', &amp; pour &...) : on les décode avant de chercher un texte.
function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&#x([0-9a-f]+);/gi, (_, hexadecimalCode) => String.fromCodePoint(parseInt(hexadecimalCode, 16)))
    .replace(/&#(\d+);/g, (_, decimalCode) => String.fromCodePoint(parseInt(decimalCode, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

// URL publique officielle : c'est elle que le sitemap doit annoncer aux moteurs de recherche.
const SITE_URL = config.siteUrl;

// Pages générées mais qui n'ont pas à être indexées : la page d'erreur et la carte à intégrer dans d'autres sites.
const NON_INDEXABLE_ROUTES = ['/404', '/carte-interactive/embed'];

function readSitemapUrls(): string[] {
  const sitemap = fs.readFileSync(path.join(GENERATED_SITE_DIRECTORY, 'sitemap.xml'), 'utf8');
  return [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(locationMatch => locationMatch[1]);
}

function convertRouteToSitemapUrl(route: string): string {
  return route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`;
}

function readGeneratedPage(route: string): string {
  return decodeHtmlEntities(fs.readFileSync(getGeneratedPagePath(route), 'utf8'));
}

describe('generated pages', () => {
  it('should_generate_html_file_when_route_is_expected', () => {
    const missingRoutes = allExpectedRoutes.filter(route => !fs.existsSync(getGeneratedPagePath(route)));

    assert.deepEqual(missingRoutes, []);
  });

  it('should_not_render_error_page_when_route_is_expected', () => {
    const routesShowingErrorPage = allExpectedRoutes
      .filter(route => fs.existsSync(getGeneratedPagePath(route)))
      .filter(route => readGeneratedPage(route).includes(ERROR_PAGE_TEXT));

    assert.deepEqual(routesShowingErrorPage, []);
  });

  it('should_contain_key_text_when_route_is_static_page', () => {
    const routesMissingKeyText = Object.entries(KEY_TEXT_BY_STATIC_ROUTE)
      .filter(([route, keyText]) => !readGeneratedPage(route).includes(keyText))
      .map(([route, keyText]) => `${route} : "${keyText}" absent`);

    assert.deepEqual(routesMissingKeyText, []);
  });

  it('should_contain_line_name_when_route_is_line_page', () => {
    const routesMissingLineName = linePages
      .filter(page => !readGeneratedPage(page.route).includes(page.lineName))
      .map(page => `${page.route} : "${page.lineName}" absent`);

    assert.deepEqual(routesMissingLineName, []);
  });

  // Détecte un bloc Markdown mal refermé qui masque la fin d'une page (cas vécu sur la VL A).
  it('should_render_every_markdown_title_when_route_is_line_page', () => {
    const missingTitles = linePages.flatMap(page => {
      const generatedPage = readGeneratedPage(page.route);
      return page.titles
        .filter(title => !generatedPage.includes(`id="${convertTitleToAnchor(title)}"`))
        .map(title => `${page.route} : titre "${title}" non rendu`);
    });

    assert.deepEqual(missingTitles, []);
  });

  it('should_contain_post_title_when_route_is_blog_post', () => {
    const routesMissingTitle = blogPostPages
      .filter(page => !readGeneratedPage(page.route).includes(page.title))
      .map(page => `${page.route} : "${page.title}" absent`);

    assert.deepEqual(routesMissingTitle, []);
  });
});

describe('sitemap', () => {
  it('should_list_every_line_page_when_sitemap_is_generated', () => {
    const sitemapUrls = readSitemapUrls();
    const missingLinePages = linePages.map(page => convertRouteToSitemapUrl(page.route)).filter(url => !sitemapUrls.includes(url));

    assert.deepEqual(missingLinePages, []);
  });

  it('should_list_every_static_page_when_sitemap_is_generated', () => {
    const sitemapUrls = readSitemapUrls();
    const indexableStaticRoutes = [...Object.keys(KEY_TEXT_BY_STATIC_ROUTE), ...CLIENT_RENDERED_ROUTES].filter(
      route => !NON_INDEXABLE_ROUTES.includes(route)
    );
    const missingStaticPages = indexableStaticRoutes.map(convertRouteToSitemapUrl).filter(url => !sitemapUrls.includes(url));

    assert.deepEqual(missingStaticPages, []);
  });

  it('should_list_every_blog_post_when_sitemap_is_generated', () => {
    const sitemapUrls = readSitemapUrls();
    const missingBlogPosts = blogPostPages.map(page => convertRouteToSitemapUrl(page.route)).filter(url => !sitemapUrls.includes(url));

    assert.deepEqual(missingBlogPosts, []);
  });

  it('should_use_site_url_when_sitemap_lists_urls', () => {
    const urlsOnOtherDomain = readSitemapUrls().filter(url => !url.startsWith(`${SITE_URL}/`));

    assert.deepEqual(urlsOnOtherDomain, []);
  });

  it('should_exclude_non_indexable_pages_when_sitemap_is_generated', () => {
    const nonIndexableUrls = NON_INDEXABLE_ROUTES.map(convertRouteToSitemapUrl);
    const listedNonIndexableUrls = readSitemapUrls().filter(url => nonIndexableUrls.includes(url));

    assert.deepEqual(listedNonIndexableUrls, []);
  });
});
