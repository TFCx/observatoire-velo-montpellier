// Outillage des tests navigateur (ADR 0006) : sert le site généré et pilote Chromium.
import fs from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser, type Page } from 'playwright-core';
import { afterAll, beforeAll } from 'vitest';

const GENERATED_SITE_DIRECTORY = fileURLToPath(new URL('../../.output/public', import.meta.url));

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8'
};

// Même résolution que Netlify pour un site statique : /page -> /page/index.html.
function findFileForUrl(url: string): string | null {
  const urlPath = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  const requestedPath = path.join(GENERATED_SITE_DIRECTORY, urlPath);
  if (!requestedPath.startsWith(GENERATED_SITE_DIRECTORY)) {
    return null;
  }
  const candidates = [requestedPath, path.join(requestedPath, 'index.html'), `${requestedPath}.html`];
  return candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null;
}

function startStaticServer(): Promise<http.Server> {
  const server = http.createServer((request, response) => {
    const filePath = findFileForUrl(request.url ?? '/');
    if (filePath === null) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }
    const contentType = CONTENT_TYPE_BY_EXTENSION[path.extname(filePath)] ?? 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(response);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// MapLibre exige WebGL2, que Chromium n'active pas de la même façon partout :
// - sans carte graphique (CI), rendu logiciel SwiftShader, désormais derrière un flag explicite ;
// - sur un poste de bureau, SwiftShader échoue (Vulkan réclame une surface d'affichage), mais la
//   vraie carte graphique fonctionne via OpenGL.
const CHROMIUM_WEBGL_ARGUMENT_CANDIDATES = [['--enable-unsafe-swiftshader'], ['--use-angle=gl']];

async function launchChromiumWithWebgl2(): Promise<Browser> {
  for (const launchArguments of CHROMIUM_WEBGL_ARGUMENT_CANDIDATES) {
    const browser = await chromium.launch({ args: launchArguments });
    const page = await browser.newPage();
    const hasWebgl2 = await page.evaluate(() => document.createElement('canvas').getContext('webgl2') !== null);
    await page.close();
    if (hasWebgl2) {
      return browser;
    }
    await browser.close();
  }
  throw new Error(`Chromium sans WebGL2 avec chacun de ces arguments : ${JSON.stringify(CHROMIUM_WEBGL_ARGUMENT_CANDIDATES)}`);
}

export type OpenedPage = {
  page: Page;
  // Erreurs de la console et exceptions JavaScript, hors échecs des requêtes externes bloquées.
  consoleErrors: string[];
};

// Message de Chromium pour une requête interrompue par page.route(...).abort().
const BLOCKED_REQUEST_CONSOLE_MESSAGE = 'net::ERR_FAILED';

export function setupBrowserTests() {
  let server: http.Server;
  let browser: Browser;
  let baseUrl: string;

  beforeAll(async () => {
    if (!fs.existsSync(path.join(GENERATED_SITE_DIRECTORY, 'index.html'))) {
      throw new Error('Site généré introuvable : lancer `npx nuxt generate` (ou `npm run test:e2e`).');
    }
    server = await startStaticServer();
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    browser = await launchChromiumWithWebgl2();
  });

  afterAll(async () => {
    await browser?.close();
    await new Promise(resolve => server?.close(resolve));
  });

  // Les requêtes vers Internet (tuiles du fond de carte, polices…) sont bloquées : les tests ne
  // dépendent pas du réseau et vérifient ce que le site dessine lui-même (nos couches GeoJSON).
  async function openPage(route: string): Promise<OpenedPage> {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const blockedExternalOrigins = new Set<string>();
    await page.route(
      url => !url.href.startsWith(baseUrl) && !url.href.startsWith('data:'),
      externalRoute => {
        blockedExternalOrigins.add(new URL(externalRoute.request().url()).origin);
        return externalRoute.abort();
      }
    );

    const consoleErrors: string[] = [];
    const isCausedByBlockedRequest = (message: string) =>
      message.includes(BLOCKED_REQUEST_CONSOLE_MESSAGE) ||
      [...blockedExternalOrigins].some(origin => message.includes(origin));
    page.on('console', message => {
      if (message.type() === 'error' && !isCausedByBlockedRequest(message.text())) {
        consoleErrors.push(message.text());
      }
    });
    page.on('pageerror', error => {
      if (!isCausedByBlockedRequest(error.message)) {
        consoleErrors.push(error.message);
      }
    });

    await page.goto(`${baseUrl}${route}`, { waitUntil: 'load' });
    return { page, consoleErrors };
  }

  return { openPage };
}

// Nombre de couleurs différentes dans la carte telle qu'affichée à l'écran. Une carte vide est
// d'un gris uniforme, une carte dessinée en compte des milliers.
// Tout ce qui recouvre la carte (légende, boutons, logo, attributions) est masqué pendant la
// capture : leurs textes et images suffisent à produire des milliers de couleurs sur une carte vide.
// La capture d'écran est décodée par Chromium lui-même, pour éviter une dépendance de décodage PNG.
const SHOW_ONLY_MAP_CANVAS_STYLE = 'body * { visibility: hidden; } canvas.maplibregl-canvas { visibility: visible; }';

export async function countDistinctMapColors(page: Page): Promise<number> {
  const canvas = page.locator('canvas.maplibregl-canvas').first();
  const screenshot = await canvas.screenshot({ style: SHOW_ONLY_MAP_CANVAS_STYLE });
  return page.evaluate(async (base64Png: string) => {
    const blob = await (await fetch(`data:image/png;base64,${base64Png}`)).blob();
    const bitmap = await createImageBitmap(blob);
    const drawingCanvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = drawingCanvas.getContext('2d')!;
    context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
    const distinctColors = new Set<number>();
    for (let index = 0; index < pixels.length; index += 4) {
      distinctColors.add((pixels[index] << 16) | (pixels[index + 1] << 8) | pixels[index + 2]);
    }
    return distinctColors.size;
  }, screenshot.toString('base64'));
}
