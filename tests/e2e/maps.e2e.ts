// Tests navigateur des cartes : lancer `npm run test:e2e` (ADR 0006).
import type { Page } from 'playwright-core';
import { describe, expect, it } from 'vitest';

import { countDistinctMapColors } from './browser';
import { setupBrowserTests } from './setup';

// Mesuré le 29/09/2026, fond de carte bloqué : une carte vide compte 6 couleurs ; nos couches
// seules en dessinent de 1 400 (une Véloligne) à 14 000 (carte interactive).
const MINIMUM_COLORS_OF_A_DRAWN_MAP = 200;

const MAP_PAGES = [
  { name: 'line_page', route: '/veloligne-1' },
  { name: 'interactive_map_page', route: '/carte-interactive' },
  { name: 'embedded_map_page', route: '/carte-interactive/embed' },
  { name: 'evolution_page', route: '/evolution' },
];

// Une carte se dessine en 3 s au plus en CI : 20 s laissent de la marge sans trop retarder l'échec
// quand elle ne se dessine jamais (chaque test attend alors ce délai).
function waitUntilMapIsDrawn(page: Page) {
  return expect
    .poll(() => countDistinctMapColors(page), { timeout: 20_000, interval: 1_000 })
    .toBeGreaterThanOrEqual(MINIMUM_COLORS_OF_A_DRAWN_MAP);
}

describe('maps', () => {
  const { openPage } = setupBrowserTests();

  for (const mapPage of MAP_PAGES) {
    it(`should_draw_the_map_when_${mapPage.name}_loads`, async () => {
      const { page } = await openPage(mapPage.route);
      await page.locator('canvas.maplibregl-canvas').first().waitFor();

      await waitUntilMapIsDrawn(page);

      await page.close();
    });

    it(`should_log_no_error_when_${mapPage.name}_loads`, async () => {
      const { page, consoleErrors } = await openPage(mapPage.route);
      await page.locator('canvas.maplibregl-canvas').first().waitFor();
      // Les erreurs du worker ou des couches arrivent pendant le dessin : on l'attend, sans en faire
      // la condition de ce test (c'est celle du test précédent).
      await waitUntilMapIsDrawn(page).catch(() => undefined);

      expect(consoleErrors, `Erreurs :\n${consoleErrors.join('\n')}`).toEqual([]);

      await page.close();
    });
  }

  // Un lien interne ne recharge pas la page (application d'une seule page) : seul le composant de la
  // carte peut libérer ce qu'elle occupe quand on la quitte.
  async function leaveMapPageByHeaderLogo(page: Page) {
    await page.locator('#navigation-header a[href="/"]').first().click();
    await page.locator('canvas.maplibregl-canvas').waitFor({ state: 'detached' });
  }

  it('should_release_the_webgl_context_when_leaving_a_map_page', async () => {
    const { page } = await openPage('/carte-interactive');
    await page.locator('canvas.maplibregl-canvas').first().waitFor();
    await waitUntilMapIsDrawn(page);
    // getContext rend le contexte déjà créé par MapLibre ; il est gardé pour être relu après la navigation.
    const hasMapContext = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('canvas.maplibregl-canvas');
      const windowWithMapContext = window as Window & { leftMapContext?: WebGL2RenderingContext | null };
      windowWithMapContext.leftMapContext = canvas?.getContext('webgl2');
      return windowWithMapContext.leftMapContext !== null && windowWithMapContext.leftMapContext !== undefined;
    });
    expect(hasMapContext).toBe(true);

    await leaveMapPageByHeaderLogo(page);

    // Chromium garde 16 contextes WebGL au plus : une carte non libérée finit par faire perdre le sien à
    // une carte affichée.
    const isLeftMapContextLost = await page.evaluate(() =>
      (window as Window & { leftMapContext?: WebGL2RenderingContext | null }).leftMapContext?.isContextLost(),
    );
    expect(isLeftMapContextLost).toBe(true);

    await page.close();
  });

  it('should_log_no_error_when_changing_layer_after_coming_back_to_a_map_page', async () => {
    const { page, consoleErrors } = await openPage('/carte-interactive');
    await page.locator('canvas.maplibregl-canvas').first().waitFor();
    await waitUntilMapIsDrawn(page);
    await leaveMapPageByHeaderLogo(page);
    await page.goBack();
    await page.locator('canvas.maplibregl-canvas').first().waitFor();
    await waitUntilMapIsDrawn(page);

    // Un watcher resté attaché à la carte quittée la redessinerait aussi, alors qu'elle n'a plus de style.
    await page.locator('#quality').click();
    // Les erreurs du changement de couche sont émises avant l'image suivante.
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

    expect(consoleErrors, `Erreurs :\n${consoleErrors.join('\n')}`).toEqual([]);

    await page.close();
  });
});
