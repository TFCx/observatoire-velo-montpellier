// Tests navigateur du tooltip de survol des tronçons : lancer `npm run test:e2e` (ADR 0006).
import { describe, expect, it } from 'vitest';

import { countDistinctMapColors, findEmptyMapPoint, findNetworkPoint } from './browser';
import { setupBrowserTests } from './setup';

const MINIMUM_COLORS_OF_A_DRAWN_MAP = 200;
const HOVER_TOOLTIP = '.line-hover-tooltip';

describe('hover tooltip', () => {
  const { openPage } = setupBrowserTests();

  async function openDrawnInteractiveMap() {
    const { page } = await openPage('/carte-interactive');
    await page.locator('canvas.maplibregl-canvas').first().waitFor();
    await expect
      .poll(() => countDistinctMapColors(page), { timeout: 20_000, interval: 1_000 })
      .toBeGreaterThanOrEqual(MINIMUM_COLORS_OF_A_DRAWN_MAP);
    return page;
  }

  it('should_show_section_name_when_hovering_a_section', async () => {
    const page = await openDrawnInteractiveMap();
    const sectionPoint = await findNetworkPoint(page);

    await page.mouse.move(sectionPoint.x, sectionPoint.y);

    await expect.poll(() => page.locator(HOVER_TOOLTIP).count(), { timeout: 5_000 }).toBe(1);
    await page.close();
  });

  it('should_show_quality_badge_when_hovering_a_section', async () => {
    const page = await openDrawnInteractiveMap();
    const sectionPoint = await findNetworkPoint(page);

    await page.mouse.move(sectionPoint.x, sectionPoint.y);

    await expect
      .poll(() => page.locator(`${HOVER_TOOLTIP} .quality-badge`).count(), { timeout: 5_000 })
      .toBeGreaterThan(0);
    await page.close();
  });

  it('should_hide_tooltip_when_leaving_the_section', async () => {
    const page = await openDrawnInteractiveMap();
    const sectionPoint = await findNetworkPoint(page);
    const emptyPoint = await findEmptyMapPoint(page);
    await page.mouse.move(sectionPoint.x, sectionPoint.y);
    await expect.poll(() => page.locator(HOVER_TOOLTIP).count(), { timeout: 5_000 }).toBe(1);

    await page.mouse.move(emptyPoint.x, emptyPoint.y);

    await expect.poll(() => page.locator(HOVER_TOOLTIP).count(), { timeout: 5_000 }).toBe(0);
    await page.close();
  });
});
