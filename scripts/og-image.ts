// Produit public/og-image.png, l'image affichée quand une page du site est partagée sur un réseau
// social : le bandeau de l'observatoire au-dessus de la carte du réseau final des Vélolignes.
// Le réseau final ne change qu'à une révision du plan : relancer alors `npm run og-image` et
// committer l'image. Nécessite Internet (fond de carte) et Chromium (voir tests/e2e).
import fs from 'node:fs';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  GENERATED_SITE_DIRECTORY,
  countDistinctMapColors,
  launchChromiumWithWebgl2,
  startStaticServer
} from '../tests/e2e/browser.ts';

// Format recommandé par les réseaux sociaux pour les grands aperçus (rapport 1,91:1).
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;
const BANNER_HEIGHT = 130;
const BANNER_COLOR = 'rgb(255, 220, 78)';
// Même seuil que les tests navigateur : en dessous, la carte n'est pas encore dessinée.
const MINIMUM_COLORS_OF_A_DRAWN_MAP = 200;
// Laisse aux tuiles du fond de carte le temps de s'afficher une fois nos couches dessinées.
const BASE_MAP_SETTLING_DELAY_MS = 5_000;

const PROJECT_DIRECTORY = fileURLToPath(new URL('..', import.meta.url));
const LOGO_PATH = path.join(PROJECT_DIRECTORY, 'assets', 'logoCyclopolisVGM.png');
const OUTPUT_PATH = path.join(PROJECT_DIRECTORY, 'public', 'og-image.png');

function convertToDataUri(pngContent: Buffer): string {
  return `data:image/png;base64,${pngContent.toString('base64')}`;
}

async function main() {
  if (!fs.existsSync(path.join(GENERATED_SITE_DIRECTORY, 'index.html'))) {
    throw new Error('Site généré introuvable : lancer `npm run og-image`, qui le génère d\'abord.');
  }
  const server = await startStaticServer();
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const browser = await launchChromiumWithWebgl2();

  try {
    const mapPage = await browser.newPage({ viewport: { width: IMAGE_WIDTH, height: IMAGE_HEIGHT - BANNER_HEIGHT } });
    await mapPage.goto(`${baseUrl}/carte-interactive/embed`, { waitUntil: 'networkidle' });
    await mapPage.getByText('du futur réseau').click();
    while ((await countDistinctMapColors(mapPage)) < MINIMUM_COLORS_OF_A_DRAWN_MAP) {
      await mapPage.waitForTimeout(1_000);
    }
    await mapPage.waitForTimeout(BASE_MAP_SETTLING_DELAY_MS);

    // La licence des données OpenStreetMap impose de citer les sources sur l'image : on reprend le
    // texte d'attribution affiché par la carte, pour qu'il suive le fond de carte utilisé.
    const attribution = (await mapPage.locator('.maplibregl-ctrl-attrib-inner').innerText()).trim();
    const mapScreenshot = await mapPage.locator('canvas.maplibregl-canvas').first().screenshot({
      style: 'body * { visibility: hidden; } canvas.maplibregl-canvas { visibility: visible; }'
    });

    const compositionPage = await browser.newPage({ viewport: { width: IMAGE_WIDTH, height: IMAGE_HEIGHT } });
    await compositionPage.setContent(`
      <body style="margin: 0; width: ${IMAGE_WIDTH}px; height: ${IMAGE_HEIGHT}px; overflow: hidden; position: relative; font-family: sans-serif;">
        <div style="height: ${BANNER_HEIGHT}px; background: ${BANNER_COLOR}; display: flex; align-items: center; justify-content: center;">
          <img src="${convertToDataUri(fs.readFileSync(LOGO_PATH))}">
        </div>
        <img src="${convertToDataUri(mapScreenshot)}" style="display: block; width: ${IMAGE_WIDTH}px; height: ${IMAGE_HEIGHT - BANNER_HEIGHT}px;">
        <div style="position: absolute; right: 0; bottom: 0; padding: 2px 6px; font-size: 12px; color: #333; background: rgba(255, 255, 255, 0.75);"></div>
      </body>`);
    await compositionPage.locator('body > div:last-child').evaluate((element, text) => {
      element.textContent = text;
    }, attribution);
    await compositionPage.screenshot({ path: OUTPUT_PATH });
    console.log(`Image de partage écrite : ${path.relative(PROJECT_DIRECTORY, OUTPUT_PATH)} (attribution : ${attribution})`);
  } finally {
    await browser.close();
    server.close();
  }
}

await main();
