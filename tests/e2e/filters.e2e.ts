// Tests navigateur des filtres de la carte interactive : lancer `npm run test:e2e` (ADR 0006).
import type { Page } from 'playwright-core';
import { describe, expect, it } from 'vitest';

import { countDistinctMapColors } from './browser';
import { DESKTOP_VIEWPORT, PHONE_VIEWPORT, setupBrowserTests } from './setup';

const MINIMUM_COLORS_OF_A_DRAWN_MAP = 200;
const FILTER_PANEL = 'aside[aria-label="Filtres"]';
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

  // Sous 1024 px, la carte garde la modale (ADR 0010) : le paramètre d'URL est ignoré.
  it('should_not_show_the_filter_panel_when_the_screen_is_small', async () => {
    const { page } = await openPage('/carte-interactive?panneau=filtres', PHONE_VIEWPORT);
    await waitUntilMapIsDrawn(page);

    expect(await page.locator(FILTER_PANEL).count()).toBe(0);
    await page.close();
  });

  // Une fenêtre agrandie au-delà de 1024 px, modale ouverte, ne doit pas montrer les filtres deux fois.
  it('should_move_the_filters_from_the_modal_to_the_panel_when_the_screen_becomes_large', async () => {
    const { page } = await openPage('/carte-interactive', PHONE_VIEWPORT);
    await waitUntilMapIsDrawn(page);
    await page.locator('.maplibregl-filter').click();
    await expect.poll(() => page.getByRole('dialog').count()).toBe(1);

    await page.setViewportSize(DESKTOP_VIEWPORT);

    await expect.poll(() => page.locator(FILTER_PANEL).count()).toBe(1);
    await expect.poll(() => page.getByRole('dialog').count()).toBe(0);
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
