// Tests navigateur des cartes : lancer `npm run test:e2e` (ADR 0006).
import type { Page } from 'playwright-core';
import { describe, expect, it } from 'vitest';

import { countDistinctMapColors, setupBrowserTests } from './setup';

// Mesuré le 29/09/2026, fond de carte bloqué : une carte vide compte 6 couleurs ; nos couches
// seules en dessinent de 1 400 (une Véloligne) à 14 000 (carte interactive).
const MINIMUM_COLORS_OF_A_DRAWN_MAP = 200;

const MAP_PAGES = [
  { name: 'line_page', route: '/veloligne-1' },
  { name: 'interactive_map_page', route: '/carte-interactive' },
  { name: 'embedded_map_page', route: '/carte-interactive/embed' },
  { name: 'evolution_page', route: '/evolution' }
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
});
