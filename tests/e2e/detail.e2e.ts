// Tests navigateur du panneau de détail d'un tronçon (ADR 0010) : lancer `npm run test:e2e`.
import type { Page } from 'playwright-core';
import { describe, expect, it } from 'vitest';

import { countDistinctMapColors, findNetworkPoint } from './browser';
import { DESKTOP_VIEWPORT, PHONE_VIEWPORT, setupBrowserTests } from './setup';

const MINIMUM_COLORS_OF_A_DRAWN_MAP = 200;
// Fond de carte bloqué et aucune de nos couches à l'écran (setup.ts).
const MAP_COLORS_WITHOUT_ANY_LAYER = 6;
const DETAIL_PANEL = 'aside[aria-label="Détail du tronçon"]';
const BOTTOM_SHEET = '[data-bottom-sheet]';
const DETAIL_IN_BOTTOM_SHEET = `${BOTTOM_SHEET} ${DETAIL_PANEL}`;

// Tronçon réel partagé par les Vélolignes 1 et B : son lien vers la page B a pour ancre ce titre.
const SHARED_SECTION = 'Chemin des Alouettes';
const SHARED_SECTION_ANCHOR_ON_LINE_B = 'chemin-des-alouettes-à-castelnau-le-lez';
// Titre suivant, de même niveau, sur la page de la Véloligne B.
const NEXT_TITLE_ON_LINE_B = 'chemin-de-caylus';

function detailRoute(sectionName: string, line?: string): string {
  const query = new URLSearchParams({ panneau: 'detail', troncon: sectionName, ...(line ? { ligne: line } : {}) });
  return `/carte-interactive?${query}`;
}

async function waitUntilMapIsDrawn(page: Page) {
  await page.locator('canvas.maplibregl-canvas').first().waitFor();
  await expect
    .poll(() => countDistinctMapColors(page), { timeout: 20_000, interval: 1_000 })
    .toBeGreaterThanOrEqual(MINIMUM_COLORS_OF_A_DRAWN_MAP);
}

// Change l'URL par le routeur de l'application, sans recharger la page.
async function replaceRouteQuery(page: Page, query: Record<string, string>) {
  await page.evaluate((newQuery) => {
    const nuxtRoot = document.querySelector('#__nuxt') as unknown as {
      __vue_app__: { config: { globalProperties: { $router: { replace: (to: object) => Promise<unknown> } } } };
    };
    return nuxtRoot.__vue_app__.config.globalProperties.$router.replace({ query: newQuery });
  }, query);
}

function lineBadge(page: Page, line: string) {
  return page.locator(DETAIL_PANEL).getByRole('button', { name: line, exact: true });
}

describe('section detail panel', () => {
  const { openPage } = setupBrowserTests();

  it('should_open_the_detail_panel_when_clicking_a_section_on_a_large_screen', async () => {
    const { page } = await openPage('/carte-interactive');
    await waitUntilMapIsDrawn(page);
    const sectionPoint = await findNetworkPoint(page);

    await page.mouse.click(sectionPoint.x, sectionPoint.y);

    await expect.poll(() => page.locator(DETAIL_PANEL).count()).toBe(1);
    const url = new URL(page.url());
    expect(url.searchParams.get('panneau')).toBe('detail');
    expect(url.searchParams.get('troncon')).toBeTruthy();
    // Le panneau remplace le tooltip du clic.
    expect(await page.locator('.maplibregl-popup').count()).toBe(0);
    await page.close();
  });

  it('should_show_the_page_of_the_first_line_when_the_url_names_a_shared_section', async () => {
    const { page } = await openPage(detailRoute(SHARED_SECTION));
    await waitUntilMapIsDrawn(page);

    await expect.poll(() => lineBadge(page, '1').getAttribute('aria-pressed')).toBe('true');
    expect(await lineBadge(page, 'B').getAttribute('aria-pressed')).toBe('false');
    await page.close();
  });

  it('should_switch_to_the_other_line_when_clicking_its_badge', async () => {
    const { page } = await openPage(detailRoute(SHARED_SECTION));
    await waitUntilMapIsDrawn(page);

    await lineBadge(page, 'B').click();

    await expect.poll(() => new URL(page.url()).searchParams.get('ligne')).toBe('B');
    await expect.poll(() => lineBadge(page, 'B').getAttribute('aria-pressed')).toBe('true');
    await page.close();
  });

  it('should_scroll_to_the_title_of_the_section_when_the_panel_opens', async () => {
    const { page } = await openPage(detailRoute(SHARED_SECTION, 'B'));
    await waitUntilMapIsDrawn(page);
    const panel = page.locator(DETAIL_PANEL);
    const title = panel.locator(`[id="${SHARED_SECTION_ANCHOR_ON_LINE_B}"]`);
    await title.waitFor();

    // Le titre est juste sous l'en-tête collant du panneau, à quelques pixels près.
    await expect
      .poll(async () => {
        const panelTop = (await panel.boundingBox())?.y ?? 0;
        const titleTop = (await title.boundingBox())?.y ?? 0;
        return titleTop - panelTop;
      })
      .toBeGreaterThan(0);
    await expect
      .poll(async () => {
        const panelTop = (await panel.boundingBox())?.y ?? 0;
        const titleTop = (await title.boundingBox())?.y ?? 0;
        return titleTop - panelTop;
      })
      .toBeLessThan(120);
    await page.close();
  });

  // Une page de Véloligne (des milliers de pixels) ne doit pas étirer la carte et le panneau sous la fenêtre.
  it('should_fit_the_detail_panel_in_the_window_when_the_page_is_long', async () => {
    const { page } = await openPage(detailRoute(SHARED_SECTION));
    await waitUntilMapIsDrawn(page);
    await page.locator(DETAIL_PANEL).waitFor();

    // Le panneau défile seul : la page entière ne doit pas dépasser la fenêtre.
    const pageHeight = await page.evaluate(() => document.scrollingElement?.scrollHeight ?? 0);
    expect(pageHeight).toBeLessThanOrEqual(DESKTOP_VIEWPORT.height);
    await page.close();
  });

  // Images et polices chargées après coup agrandissent le contenu au-dessus du titre : simulé ici par un
  // bloc inséré en tête de page, le fond de carte et les polices étant bloqués pendant les tests.
  it('should_keep_the_section_title_in_view_when_content_above_it_grows', async () => {
    const { page } = await openPage(detailRoute(SHARED_SECTION, 'B'));
    await waitUntilMapIsDrawn(page);
    const panel = page.locator(DETAIL_PANEL);
    const title = panel.locator(`[id="${SHARED_SECTION_ANCHOR_ON_LINE_B}"]`);
    const titleOffsetInPanel = async () =>
      ((await title.boundingBox())?.y ?? 0) - ((await panel.boundingBox())?.y ?? 0);
    await expect.poll(titleOffsetInPanel).toBeLessThan(120);

    await panel.evaluate((panelElement) => {
      const lateContent = document.createElement('div');
      lateContent.style.height = '400px';
      panelElement.querySelector(':scope > div:nth-child(2)')?.prepend(lateContent);
    });

    await expect.poll(titleOffsetInPanel).toBeLessThan(120);
    await expect.poll(titleOffsetInPanel).toBeGreaterThan(0);
    await page.close();
  });

  // Un titre en fin de page ne peut pas monter en haut du panneau : la section du tronçon est surlignée,
  // de son titre jusqu'au titre suivant de même niveau.
  it('should_highlight_the_whole_text_of_the_section_from_its_title_to_the_next_title', async () => {
    const { page } = await openPage(detailRoute(SHARED_SECTION, 'B'));
    await waitUntilMapIsDrawn(page);
    const panel = page.locator(DETAIL_PANEL);
    const highlight = panel.locator('.section-highlight');
    await highlight.waitFor();

    const highlightBox = await highlight.boundingBox();
    const titleBox = await panel.locator(`[id="${SHARED_SECTION_ANCHOR_ON_LINE_B}"]`).boundingBox();
    const nextTitleBox = await panel.locator(`[id="${NEXT_TITLE_ON_LINE_B}"]`).boundingBox();
    if (!highlightBox || !titleBox || !nextTitleBox) {
      throw new Error('Surlignage ou titres absents du panneau.');
    }

    // Dernier élément de la section : celui qui précède le titre suivant (ici l'encadré « Pas de projet »).
    const lastElementBox = await panel.locator(`[id="${NEXT_TITLE_ON_LINE_B}"]`).evaluate((nextTitle) => {
      const box = nextTitle.previousElementSibling?.getBoundingClientRect();
      return box ? { bottom: box.bottom } : null;
    });
    if (!lastElementBox) {
      throw new Error('Aucun élément avant le titre suivant.');
    }

    expect(highlightBox.y).toBeLessThanOrEqual(titleBox.y);
    expect(highlightBox.y + highlightBox.height).toBeGreaterThanOrEqual(lastElementBox.bottom);
    expect(highlightBox.y + highlightBox.height).toBeLessThanOrEqual(nextTitleBox.y);
    await page.close();
  });

  // Défilement par la barre ou au clavier : aucun événement de molette. Le panneau ne doit pas ramener la
  // lecture à l'ancre quand le contenu change ensuite de hauteur (police ou image chargée).
  it('should_keep_the_reading_position_when_content_grows_after_scrolling_with_the_scrollbar', async () => {
    const { page } = await openPage(detailRoute(SHARED_SECTION, 'B'));
    await waitUntilMapIsDrawn(page);
    const panel = page.locator(DETAIL_PANEL);
    const title = panel.locator(`[id="${SHARED_SECTION_ANCHOR_ON_LINE_B}"]`);
    const titleOffsetInPanel = async () =>
      ((await title.boundingBox())?.y ?? 0) - ((await panel.boundingBox())?.y ?? 0);
    await expect.poll(titleOffsetInPanel).toBeLessThan(120);

    await panel.evaluate((panelElement) => {
      panelElement.scrollTop += 600;
    });
    await expect.poll(titleOffsetInPanel).toBeLessThan(-300);
    await panel.evaluate((panelElement) => {
      const lateContent = document.createElement('div');
      lateContent.style.height = '400px';
      panelElement.querySelector(':scope > div:nth-child(2)')?.prepend(lateContent);
    });
    // On vérifie que rien ne se passe : il faut laisser au panneau le temps de réagir à tort.
    await page.waitForTimeout(1_000);

    expect(await titleOffsetInPanel()).toBeLessThan(-300);
    await page.close();
  });

  // Le rendu de la carte varie d'une capture à l'autre (animation du cadrage) : le test vérifie le tronçon
  // passé à la couche de mise en évidence, que la carte expose dans data-selected-section.
  it('should_highlight_the_selected_section_on_the_map', async () => {
    const { page } = await openPage(detailRoute(SHARED_SECTION));
    await waitUntilMapIsDrawn(page);

    await expect.poll(() => page.locator('#map').getAttribute('data-selected-section')).toBe(SHARED_SECTION);
    await page.close();
  });

  // Filtres et détail s'excluent dans le panneau : aucun clic ne sélectionne un tronçon masqué par les
  // filtres. Le test y arrive en changeant l'URL par le routeur, comme le ferait une future feature qui
  // renvoie vers un tronçon. Réseau entièrement masqué : restent les limites de la Métropole et, si elle
  // est indépendante des filtres, la couche du halo.
  it('should_draw_the_halo_when_filters_hide_the_selected_section', async () => {
    const { page } = await openPage('/carte-interactive?panneau=filtres');
    await waitUntilMapIsDrawn(page);
    for (const label of ['Réalisé', 'En travaux', 'Promis pour fin 2026', 'Sans échéance', 'Inconnu']) {
      await page.locator('aside[aria-label="Filtres"]').getByText(label, { exact: true }).first().click();
    }

    await replaceRouteQuery(page, { panneau: 'detail', troncon: SHARED_SECTION });
    await expect.poll(() => page.locator('#map').getAttribute('data-selected-section')).toBe(SHARED_SECTION);

    // Sans halo, la carte cadrée sur le tronçon n'a que le fond uni : 6 couleurs (mesuré le 19/11/2026).
    await expect
      .poll(() => countDistinctMapColors(page), { timeout: 10_000, interval: 1_000 })
      .toBeGreaterThan(MAP_COLORS_WITHOUT_ANY_LAYER * 3);
    await page.close();
  });

  it('should_remove_the_highlight_when_closing_the_detail_panel', async () => {
    const { page } = await openPage(detailRoute(SHARED_SECTION));
    await waitUntilMapIsDrawn(page);
    await expect.poll(() => page.locator('#map').getAttribute('data-selected-section')).toBe(SHARED_SECTION);

    await page.locator(DETAIL_PANEL).getByRole('button', { name: 'Fermer le détail' }).click();

    await expect.poll(() => page.locator('#map').getAttribute('data-selected-section')).toBeNull();
    await page.close();
  });

  // Fond de carte bloqué : cadrée sur un tronçon, la carte ne montre que quelques tracés, donc bien moins
  // de couleurs que le réseau entier.
  it('should_frame_the_map_on_the_section_when_the_url_names_it', async () => {
    const { page: wholeNetworkPage } = await openPage('/carte-interactive?panneau=filtres');
    await waitUntilMapIsDrawn(wholeNetworkPage);
    await wholeNetworkPage.waitForTimeout(2_000);
    const colorsOfTheWholeNetwork = await countDistinctMapColors(wholeNetworkPage);
    await wholeNetworkPage.close();

    const { page } = await openPage(detailRoute(SHARED_SECTION));
    await expect.poll(() => page.locator('#map').getAttribute('data-selected-section')).toBe(SHARED_SECTION);

    await expect
      .poll(() => countDistinctMapColors(page), { timeout: 10_000, interval: 1_000 })
      .toBeLessThan(colorsOfTheWholeNetwork / 2);
    await page.close();
  });

  it('should_not_draw_a_second_map_in_the_detail_panel', async () => {
    const { page } = await openPage(detailRoute(SHARED_SECTION));
    await waitUntilMapIsDrawn(page);
    await page.locator(DETAIL_PANEL).waitFor();

    expect(await page.locator(`${DETAIL_PANEL} canvas`).count()).toBe(0);
    await page.close();
  });

  it('should_remove_the_section_from_the_url_when_closing_the_detail_panel', async () => {
    const { page } = await openPage(detailRoute(SHARED_SECTION, 'B'));
    await waitUntilMapIsDrawn(page);

    await page.locator(DETAIL_PANEL).getByRole('button', { name: 'Fermer le détail' }).click();

    await expect.poll(() => page.locator(DETAIL_PANEL).count()).toBe(0);
    const url = new URL(page.url());
    expect([...url.searchParams.keys()]).toEqual([]);
    await page.close();
  });

  // Sous 1024 px, le détail est dans un bottom sheet, et l'URL est lue comme en grand écran (ADR 0011).
  it('should_show_the_detail_in_a_bottom_sheet_when_the_url_names_a_section_on_a_small_screen', async () => {
    const { page } = await openPage(detailRoute(SHARED_SECTION, 'B'), PHONE_VIEWPORT);
    await waitUntilMapIsDrawn(page);

    await expect.poll(() => page.locator(DETAIL_IN_BOTTOM_SHEET).count()).toBe(1);
    await page.close();
  });

  it('should_open_the_detail_bottom_sheet_when_clicking_a_section_on_a_small_screen', async () => {
    const { page } = await openPage('/carte-interactive', PHONE_VIEWPORT);
    await waitUntilMapIsDrawn(page);
    const sectionPoint = await findNetworkPoint(page);

    await page.mouse.click(sectionPoint.x, sectionPoint.y);

    await expect.poll(() => page.locator(DETAIL_IN_BOTTOM_SHEET).count()).toBe(1);
    expect(new URL(page.url()).searchParams.get('panneau')).toBe('detail');
    // Le bottom sheet remplace le tooltip du clic.
    expect(await page.locator('.maplibregl-popup').count()).toBe(0);
    await page.close();
  });

  // C'est l'intérieur du bottom sheet qui défile, pas le bottom sheet lui-même.
  it('should_scroll_the_bottom_sheet_to_the_title_of_the_section_on_a_small_screen', async () => {
    const { page } = await openPage(detailRoute(SHARED_SECTION, 'B'), PHONE_VIEWPORT);
    await waitUntilMapIsDrawn(page);
    const panel = page.locator(DETAIL_IN_BOTTOM_SHEET);
    const title = panel.locator(`[id="${SHARED_SECTION_ANCHOR_ON_LINE_B}"]`);
    await title.waitFor();
    const titleOffsetInPanel = async () =>
      ((await title.boundingBox())?.y ?? 0) - ((await panel.boundingBox())?.y ?? 0);

    await expect.poll(titleOffsetInPanel).toBeGreaterThan(0);
    await expect.poll(titleOffsetInPanel).toBeLessThan(120);
    await page.close();
  });

  // Le bottom sheet reste ouvert quand on passe d'une Véloligne à l'autre : il garde sa hauteur.
  it('should_keep_the_bottom_sheet_height_when_switching_to_the_other_line', async () => {
    const { page } = await openPage(detailRoute(SHARED_SECTION, '1'), PHONE_VIEWPORT);
    await waitUntilMapIsDrawn(page);
    const bottomSheet = page.locator(BOTTOM_SHEET);
    await expect.poll(async () => (await bottomSheet.boundingBox())?.y ?? 0).toBe(PHONE_VIEWPORT.height / 2);
    const handleBox = await page.locator(`${BOTTOM_SHEET} [data-bottom-sheet-handle]`).first().boundingBox();
    if (!handleBox) {
      throw new Error('Poignée du bottom sheet absente.');
    }
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2 - 200, { steps: 10 });
    await page.mouse.up();
    await expect.poll(async () => (await bottomSheet.boundingBox())?.y ?? 0).toBe(PHONE_VIEWPORT.height / 2 - 200);

    await lineBadge(page, 'B').click();

    await expect.poll(() => new URL(page.url()).searchParams.get('ligne')).toBe('B');
    expect((await bottomSheet.boundingBox())?.y).toBe(PHONE_VIEWPORT.height / 2 - 200);
    await page.close();
  });

  // Le rendu de la carte varie d'une capture à l'autre : le test lit l'affichage pour lequel la carte a
  // cadré le tronçon, qu'elle expose dans data-section-framing.
  it('should_reframe_the_section_for_the_bottom_sheet_when_the_screen_becomes_small', async () => {
    const { page } = await openPage(detailRoute(SHARED_SECTION));
    await waitUntilMapIsDrawn(page);
    await expect.poll(() => page.locator('#map').getAttribute('data-section-framing')).toBe('side-panel');

    await page.setViewportSize(PHONE_VIEWPORT);

    await expect.poll(() => page.locator('#map').getAttribute('data-section-framing')).toBe('bottom-sheet');
    await page.close();
  });
});
