// Serveur du site généré et Chromium avec WebGL2, sans dépendance à vitest : partagés par les tests
// navigateur (setup.ts, ADR 0006) et le script de l'image de partage (scripts/og-image.ts).
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser, type Page } from 'playwright-core';

export const GENERATED_SITE_DIRECTORY = fileURLToPath(new URL('../../.output/public', import.meta.url));

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
  '.txt': 'text/plain; charset=utf-8',
};

// Même résolution que Netlify pour un site statique : /page -> /page/index.html.
function findFileForUrl(url: string): string | null {
  const urlPath = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  const requestedPath = path.join(GENERATED_SITE_DIRECTORY, urlPath);
  if (!requestedPath.startsWith(GENERATED_SITE_DIRECTORY)) {
    return null;
  }
  const candidates = [requestedPath, path.join(requestedPath, 'index.html'), `${requestedPath}.html`];
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null;
}

export function startStaticServer(): Promise<http.Server> {
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
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// MapLibre exige WebGL2, que Chromium n'active pas de la même façon partout :
// - sans carte graphique (CI), rendu logiciel SwiftShader, désormais derrière un flag explicite ;
// - sur un poste de bureau, SwiftShader échoue (Vulkan réclame une surface d'affichage), mais la
//   vraie carte graphique fonctionne via OpenGL.
const CHROMIUM_WEBGL_ARGUMENT_CANDIDATES = [['--enable-unsafe-swiftshader'], ['--use-angle=gl']];

export async function launchChromiumWithWebgl2(): Promise<Browser> {
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
  throw new Error(
    `Chromium sans WebGL2 avec chacun de ces arguments : ${JSON.stringify(CHROMIUM_WEBGL_ARGUMENT_CANDIDATES)}`,
  );
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
      const [red = 0, green = 0, blue = 0] = pixels.subarray(index, index + 3);
      distinctColors.add((red << 16) | (green << 8) | blue);
    }
    return distinctColors.size;
  }, screenshot.toString('base64'));
}

export type ScreenPoint = { x: number; y: number };

type MapPointKind = 'network' | 'empty';

// Point de la carte, en coordonnées de la page, où placer la souris. Le fond de carte étant bloqué
// (setup.ts), il est d'une couleur unie : un pixel entouré de pixels d'une autre couleur est un
// tronçon dessiné, un pixel entouré de fond est un endroit vide. La recherche évite les bords de la
// carte, recouverts par la légende, les boutons et le logo, qui captent la souris.
async function findMapPoint(page: Page, kind: MapPointKind): Promise<ScreenPoint> {
  const canvas = page.locator('canvas.maplibregl-canvas').first();
  const canvasBox = await canvas.boundingBox();
  if (!canvasBox) {
    throw new Error('Carte absente de la page.');
  }
  const screenshot = await canvas.screenshot({ style: SHOW_ONLY_MAP_CANVAS_STYLE });
  const pointInCanvas = await page.evaluate(
    async ({ base64Png, searchedKind }) => {
      const blob = await (await fetch(`data:image/png;base64,${base64Png}`)).blob();
      const bitmap = await createImageBitmap(blob);
      const drawingCanvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = drawingCanvas.getContext('2d')!;
      context.drawImage(bitmap, 0, 0);
      const { width, height } = bitmap;
      const pixels = context.getImageData(0, 0, width, height).data;
      const colorAt = (x: number, y: number) => {
        const index = (y * width + x) * 4;
        return ((pixels[index] ?? 0) << 16) | ((pixels[index + 1] ?? 0) << 8) | (pixels[index + 2] ?? 0);
      };

      const occurrencesByColor = new Map<number, number>();
      for (let y = 0; y < height; y += 4) {
        for (let x = 0; x < width; x += 4) {
          const color = colorAt(x, y);
          occurrencesByColor.set(color, (occurrencesByColor.get(color) ?? 0) + 1);
        }
      }
      const backgroundColor = [...occurrencesByColor].sort((a, b) => b[1] - a[1])[0]?.[0];

      const NEIGHBOR_DISTANCE = searchedKind === 'network' ? 2 : 12;
      const isWantedAround = (x: number, y: number) =>
        [
          [0, 0],
          [NEIGHBOR_DISTANCE, 0],
          [-NEIGHBOR_DISTANCE, 0],
          [0, NEIGHBOR_DISTANCE],
          [0, -NEIGHBOR_DISTANCE],
        ].every(([dx = 0, dy = 0]) => (colorAt(x + dx, y + dy) === backgroundColor) === (searchedKind === 'empty'));

      const MARGIN_LEFT = 260;
      const MARGIN_RIGHT = 80;
      const MARGIN_TOP = 40;
      const MARGIN_BOTTOM = 110;
      for (let y = MARGIN_TOP; y < height - MARGIN_BOTTOM; y += 3) {
        for (let x = MARGIN_LEFT; x < width - MARGIN_RIGHT; x += 3) {
          if (isWantedAround(x, y)) {
            return { x, y };
          }
        }
      }
      return null;
    },
    { base64Png: screenshot.toString('base64'), searchedKind: kind },
  );
  if (!pointInCanvas) {
    throw new Error(`Aucun point « ${kind} » trouvé sur la carte.`);
  }
  return { x: canvasBox.x + pointInCanvas.x, y: canvasBox.y + pointInCanvas.y };
}

export function findNetworkPoint(page: Page): Promise<ScreenPoint> {
  return findMapPoint(page, 'network');
}

export function findEmptyMapPoint(page: Page): Promise<ScreenPoint> {
  return findMapPoint(page, 'empty');
}
