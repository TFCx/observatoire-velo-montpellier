// Tests navigateur des filtres de la carte interactive : lancer `npm run test:e2e` (ADR 0006).
import type { Page } from 'playwright-core';
import { describe, expect, it } from 'vitest';

import { countDistinctMapColors } from './browser';
import { PHONE_VIEWPORT, setupBrowserTests } from './setup';

const MINIMUM_COLORS_OF_A_DRAWN_MAP = 200;
const STATUS_FILTER_LABELS = ['Réalisé', 'En travaux', 'Promis pour fin 2026', 'Sans échéance', 'Inconnu'];

async function waitUntilMapIsDrawn(page: Page): Promise<number> {
  await page.locator('canvas.maplibregl-canvas').first().waitFor();
  await expect
    .poll(() => countDistinctMapColors(page), { timeout: 20_000, interval: 1_000 })
    .toBeGreaterThanOrEqual(MINIMUM_COLORS_OF_A_DRAWN_MAP);
  return countDistinctMapColors(page);
}

describe('map filters', () => {
  const { openPage } = setupBrowserTests();

  it('should_hide_the_network_when_every_status_is_unselected_in_the_filter_modal', async () => {
    const { page } = await openPage('/carte-interactive', PHONE_VIEWPORT);
    const colorsOfTheWholeNetwork = await waitUntilMapIsDrawn(page);

    await page.locator('.maplibregl-filter').click();
    const modal = page.getByRole('dialog');
    for (const label of STATUS_FILTER_LABELS) {
      await modal.getByText(label, { exact: true }).first().click();
    }
    await page.keyboard.press('Escape');

    // Restent les limites de la Métropole : bien moins de couleurs que le réseau entier.
    await expect
      .poll(() => countDistinctMapColors(page), { timeout: 10_000, interval: 1_000 })
      .toBeLessThan(colorsOfTheWholeNetwork / 2);
    await page.close();
  });
});
