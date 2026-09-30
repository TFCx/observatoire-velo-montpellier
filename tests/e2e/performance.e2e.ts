// Tests navigateur de la charge d'une carte immobile : lancer `npm run test:e2e` (ADR 0006).
import { describe, expect, it } from 'vitest';

import { countDistinctMapColors } from './browser';
import { setupBrowserTests } from './setup';

const MINIMUM_COLORS_OF_A_DRAWN_MAP = 200;
const IDLE_MEASUREMENT_MS = 3_000;
// Mesuré le 30/09/2026 : ~310 ms sur 3 s avec l'animation des tronçons en travaux (redessin de toute
// la carte à chaque image), 0 ms sans. La marge couvre le travail ponctuel du navigateur.
const MAXIMUM_BUSY_MS_WHEN_IDLE = 100;

describe('idle map', () => {
  const { openPage } = setupBrowserTests();

  it('should_leave_the_browser_idle_when_the_interactive_map_is_still', async () => {
    const { page } = await openPage('/carte-interactive');
    await page.locator('canvas.maplibregl-canvas').first().waitFor();
    await expect
      .poll(() => countDistinctMapColors(page), { timeout: 20_000, interval: 1_000 })
      .toBeGreaterThanOrEqual(MINIMUM_COLORS_OF_A_DRAWN_MAP);
    // Laisse finir le chargement et les transitions de départ.
    await page.waitForTimeout(2_000);

    const devTools = await page.context().newCDPSession(page);
    await devTools.send('Performance.enable');
    const readBusySeconds = async () =>
      (await devTools.send('Performance.getMetrics')).metrics.find((metric) => metric.name === 'TaskDuration')?.value ??
      0;
    const busyBefore = await readBusySeconds();
    await page.waitForTimeout(IDLE_MEASUREMENT_MS);
    const busyMs = ((await readBusySeconds()) - busyBefore) * 1000;

    expect(busyMs).toBeLessThan(MAXIMUM_BUSY_MS_WHEN_IDLE);
    await page.close();
  });
});
