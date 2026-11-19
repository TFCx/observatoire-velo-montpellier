// Tests navigateur des filtres de la carte interactive : lancer `npm run test:e2e` (ADR 0006).
import type { Page } from 'playwright-core';
import { describe, expect, it } from 'vitest';

import { countDistinctMapColors } from './browser';
import { DESKTOP_VIEWPORT, PHONE_VIEWPORT, setupBrowserTests } from './setup';

const MINIMUM_COLORS_OF_A_DRAWN_MAP = 200;
const FILTER_PANEL = 'aside[aria-label="Filtres"]';
const BOTTOM_SHEET = '[data-bottom-sheet]';
const FILTERS_IN_BOTTOM_SHEET = `${BOTTOM_SHEET} ${FILTER_PANEL}`;
const STATUS_FILTER_LABELS = ['Réalisé', 'En travaux', 'Promis pour fin 2026', 'Sans échéance', 'Inconnu'];

// Glisse la poignée du bottom sheet à la souris : vers le haut si deltaY est négatif.
async function dragBottomSheetHandle(page: Page, deltaY: number) {
  const handleBox = await page.locator(`${BOTTOM_SHEET} [data-bottom-sheet-handle]`).first().boundingBox();
  if (!handleBox) {
    throw new Error('Poignée du bottom sheet absente.');
  }
  const startX = handleBox.x + handleBox.width / 2;
  const startY = handleBox.y + handleBox.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX, startY + deltaY, { steps: 10 });
  await page.mouse.up();
}

async function waitUntilMapIsDrawn(page: Page): Promise<number> {
  await page.locator('canvas.maplibregl-canvas').first().waitFor();
  await expect
    .poll(() => countDistinctMapColors(page), { timeout: 20_000, interval: 1_000 })
    .toBeGreaterThanOrEqual(MINIMUM_COLORS_OF_A_DRAWN_MAP);
  return countDistinctMapColors(page);
}

describe('map filters', () => {
  const { openPage } = setupBrowserTests();

  it('should_hide_the_network_when_every_status_is_unselected_in_the_filter_bottom_sheet', async () => {
    const { page } = await openPage('/carte-interactive', PHONE_VIEWPORT);
    const colorsOfTheWholeNetwork = await waitUntilMapIsDrawn(page);

    await page.locator('.maplibregl-filter').click();
    const bottomSheet = page.locator(FILTERS_IN_BOTTOM_SHEET);
    for (const label of STATUS_FILTER_LABELS) {
      await bottomSheet.getByText(label, { exact: true }).first().click();
    }

    // Restent les limites de la Métropole : bien moins de couleurs que le réseau entier.
    await expect
      .poll(() => countDistinctMapColors(page), { timeout: 10_000, interval: 1_000 })
      .toBeLessThan(colorsOfTheWholeNetwork / 2);
    await page.close();
  });

  it('should_show_the_filter_panel_when_the_url_asks_for_it', async () => {
    const { page } = await openPage('/carte-interactive?panneau=filtres');
    await waitUntilMapIsDrawn(page);

    await expect.poll(() => page.locator(FILTER_PANEL).count()).toBe(1);
    await page.close();
  });

  it('should_open_the_filter_panel_when_clicking_the_filter_button_on_a_large_screen', async () => {
    const { page } = await openPage('/carte-interactive');
    await waitUntilMapIsDrawn(page);

    await page.locator('.maplibregl-filter').click();

    await expect.poll(() => new URL(page.url()).searchParams.get('panneau')).toBe('filtres');
    await expect.poll(() => page.locator(FILTER_PANEL).count()).toBe(1);
    expect(await page.getByRole('dialog').count()).toBe(0);
    await page.close();
  });

  it('should_remove_the_panel_from_the_url_when_closing_the_filter_panel', async () => {
    const { page } = await openPage('/carte-interactive?panneau=filtres');
    await waitUntilMapIsDrawn(page);

    await page.locator(FILTER_PANEL).getByRole('button', { name: 'Fermer les filtres' }).click();

    await expect.poll(() => new URL(page.url()).searchParams.has('panneau')).toBe(false);
    await expect.poll(() => page.locator(FILTER_PANEL).count()).toBe(0);
    await page.close();
  });

  it('should_narrow_the_map_when_the_filter_panel_is_open', async () => {
    const { page } = await openPage('/carte-interactive?panneau=filtres');
    await waitUntilMapIsDrawn(page);

    const panelWidth = (await page.locator(FILTER_PANEL).boundingBox())?.width ?? 0;
    const mapWidth = (await page.locator('canvas.maplibregl-canvas').first().boundingBox())?.width ?? 0;

    expect(panelWidth).toBeGreaterThan(300);
    expect(mapWidth).toBeLessThanOrEqual(DESKTOP_VIEWPORT.width - panelWidth);
    await page.close();
  });

  // MapLibre suit la taille de son conteneur (ResizeObserver) : la carte rétrécit sans appel explicite.
  it('should_narrow_the_map_when_the_filter_button_opens_the_panel', async () => {
    const { page } = await openPage('/carte-interactive');
    await waitUntilMapIsDrawn(page);

    await page.locator('.maplibregl-filter').click();
    await page.locator(FILTER_PANEL).waitFor();
    const panelWidth = (await page.locator(FILTER_PANEL).boundingBox())?.width ?? 0;

    await expect
      .poll(async () => (await page.locator('canvas.maplibregl-canvas').first().boundingBox())?.width ?? 0)
      .toBeLessThanOrEqual(DESKTOP_VIEWPORT.width - panelWidth);
    await page.close();
  });

  it('should_hide_the_network_when_every_status_is_unselected_in_the_filter_panel', async () => {
    const { page } = await openPage('/carte-interactive?panneau=filtres');
    const colorsOfTheWholeNetwork = await waitUntilMapIsDrawn(page);

    const panel = page.locator(FILTER_PANEL);
    for (const label of STATUS_FILTER_LABELS) {
      await panel.getByText(label, { exact: true }).first().click();
    }

    await expect
      .poll(() => countDistinctMapColors(page), { timeout: 10_000, interval: 1_000 })
      .toBeLessThan(colorsOfTheWholeNetwork / 2);
    await page.close();
  });

  // Sous 1024 px, les filtres sont dans un bottom sheet, et l'URL est lue comme en grand écran (ADR 0011).
  it('should_show_the_filters_in_a_bottom_sheet_when_the_url_asks_for_it_on_a_small_screen', async () => {
    const { page } = await openPage('/carte-interactive?panneau=filtres', PHONE_VIEWPORT);
    await waitUntilMapIsDrawn(page);

    await expect.poll(() => page.locator(FILTERS_IN_BOTTOM_SHEET).count()).toBe(1);
    await page.close();
  });

  it('should_open_the_filter_bottom_sheet_when_clicking_the_filter_button_on_a_small_screen', async () => {
    const { page } = await openPage('/carte-interactive', PHONE_VIEWPORT);
    await waitUntilMapIsDrawn(page);

    await page.locator('.maplibregl-filter').click();

    await expect.poll(() => new URL(page.url()).searchParams.get('panneau')).toBe('filtres');
    await expect.poll(() => page.locator(FILTERS_IN_BOTTOM_SHEET).count()).toBe(1);
    expect(await page.getByRole('dialog').count()).toBe(0);
    await page.close();
  });

  it('should_open_the_bottom_sheet_at_half_the_screen_height', async () => {
    const { page } = await openPage('/carte-interactive?panneau=filtres', PHONE_VIEWPORT);
    await waitUntilMapIsDrawn(page);

    // L'animation d'ouverture fait glisser le bottom sheet : on attend qu'il soit en place.
    await expect
      .poll(async () => (await page.locator(BOTTOM_SHEET).boundingBox())?.y ?? 0)
      .toBe(PHONE_VIEWPORT.height / 2);
    await page.close();
  });

  it('should_follow_the_finger_when_the_bottom_sheet_handle_is_dragged_up', async () => {
    const { page } = await openPage('/carte-interactive?panneau=filtres', PHONE_VIEWPORT);
    await waitUntilMapIsDrawn(page);
    const bottomSheet = page.locator(BOTTOM_SHEET);
    await expect.poll(async () => (await bottomSheet.boundingBox())?.y ?? 0).toBe(PHONE_VIEWPORT.height / 2);

    await dragBottomSheetHandle(page, -200);

    await expect.poll(async () => (await bottomSheet.boundingBox())?.y ?? 0).toBe(PHONE_VIEWPORT.height / 2 - 200);
    await page.close();
  });

  it('should_close_the_bottom_sheet_when_dragged_under_150_px', async () => {
    const { page } = await openPage('/carte-interactive?panneau=filtres', PHONE_VIEWPORT);
    await waitUntilMapIsDrawn(page);
    await expect
      .poll(async () => (await page.locator(BOTTOM_SHEET).boundingBox())?.y ?? 0)
      .toBe(PHONE_VIEWPORT.height / 2);

    await dragBottomSheetHandle(page, PHONE_VIEWPORT.height / 2 - 100);

    await expect.poll(() => new URL(page.url()).searchParams.has('panneau')).toBe(false);
    await expect.poll(() => page.locator(BOTTOM_SHEET).count()).toBe(0);
    await page.close();
  });

  // Téléphone tourné en paysage, bottom sheet agrandi : sa poignée doit rester à l'écran pour le régler
  // ou le fermer (review croisée de la PR 52).
  it('should_keep_the_bottom_sheet_handle_on_screen_when_the_screen_gets_shorter', async () => {
    const { page } = await openPage('/carte-interactive?panneau=filtres', PHONE_VIEWPORT);
    await waitUntilMapIsDrawn(page);
    const bottomSheet = page.locator(BOTTOM_SHEET);
    await expect.poll(async () => (await bottomSheet.boundingBox())?.y ?? 0).toBe(PHONE_VIEWPORT.height / 2);
    await dragBottomSheetHandle(page, -PHONE_VIEWPORT.height);
    await expect.poll(async () => (await bottomSheet.boundingBox())?.height ?? 0).toBe(PHONE_VIEWPORT.height * 0.9);

    const LANDSCAPE_PHONE_VIEWPORT = { width: PHONE_VIEWPORT.height, height: PHONE_VIEWPORT.width };
    await page.setViewportSize(LANDSCAPE_PHONE_VIEWPORT);

    await expect
      .poll(async () => (await bottomSheet.boundingBox())?.height ?? 0)
      .toBeLessThanOrEqual(LANDSCAPE_PHONE_VIEWPORT.height * 0.9);
    await page.close();
  });

  // Même état dans l'URL : en passant au-dessus de 1024 px, les filtres changent seulement d'affichage.
  it('should_move_the_filters_from_the_bottom_sheet_to_the_side_panel_when_the_screen_becomes_large', async () => {
    const { page } = await openPage('/carte-interactive', PHONE_VIEWPORT);
    await waitUntilMapIsDrawn(page);
    await page.locator('.maplibregl-filter').click();
    await expect.poll(() => page.locator(FILTERS_IN_BOTTOM_SHEET).count()).toBe(1);

    await page.setViewportSize(DESKTOP_VIEWPORT);

    await expect.poll(() => page.locator(BOTTOM_SHEET).count()).toBe(0);
    await expect.poll(() => page.locator(FILTER_PANEL).count()).toBe(1);
    await page.close();
  });

  // Les autres cartes ne lisent pas l'URL : le bouton ouvre toujours la modale.
  it('should_open_the_filter_modal_when_the_map_is_not_the_interactive_map', async () => {
    const { page } = await openPage('/carte-interactive/embed');
    await waitUntilMapIsDrawn(page);

    await page.locator('.maplibregl-filter').click();

    await expect.poll(() => page.getByRole('dialog').count()).toBe(1);
    await page.close();
  });
});
