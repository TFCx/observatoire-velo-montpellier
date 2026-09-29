// Outillage des tests navigateur (ADR 0006) : sert le site généré et pilote Chromium.
import fs from 'node:fs';
import type http from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { afterAll, beforeAll } from 'vitest';

import { GENERATED_SITE_DIRECTORY, launchChromiumWithWebgl2, startStaticServer } from './browser';

export type OpenedPage = {
  page: Page;
  // Erreurs de la console et exceptions JavaScript, hors échecs des requêtes externes bloquées.
  consoleErrors: string[];
};

export function setupBrowserTests() {
  let server: http.Server;
  let browser: Browser;
  let baseUrl: string;

  beforeAll(async () => {
    if (!fs.existsSync(path.join(GENERATED_SITE_DIRECTORY, 'index.html'))) {
      throw new Error('Site généré introuvable : lancer `npx nuxt generate` (ou `npm run test:e2e`).');
    }
    server = await startStaticServer();
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    browser = await launchChromiumWithWebgl2();
  });

  afterAll(async () => {
    await browser?.close();
    await new Promise(resolve => server?.close(resolve));
  });

  // Les requêtes vers Internet (tuiles du fond de carte, polices…) sont bloquées : les tests ne
  // dépendent pas du réseau et vérifient ce que le site dessine lui-même (nos couches GeoJSON).
  async function openPage(route: string): Promise<OpenedPage> {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const blockedExternalUrls = new Set<string>();
    await page.route(
      url => !url.href.startsWith(baseUrl) && !url.href.startsWith('data:'),
      externalRoute => {
        blockedExternalUrls.add(externalRoute.request().url());
        return externalRoute.abort();
      }
    );

    // Une erreur n'est ignorée que si elle désigne une requête que nous avons bloquée : par son
    // emplacement (« Failed to load resource » n'a pas l'URL dans son texte) ou par son texte
    // (erreurs de chargement relayées par MapLibre).
    const consoleErrors: string[] = [];
    const isCausedByBlockedRequest = (text: string, sourceUrl: string) =>
      blockedExternalUrls.has(sourceUrl) || [...blockedExternalUrls].some(blockedUrl => text.includes(blockedUrl));
    page.on('console', message => {
      if (message.type() === 'error' && !isCausedByBlockedRequest(message.text(), message.location().url)) {
        consoleErrors.push(message.text());
      }
    });
    page.on('pageerror', error => {
      if (!isCausedByBlockedRequest(error.message, '')) {
        consoleErrors.push(error.message);
      }
    });

    await page.goto(`${baseUrl}${route}`, { waitUntil: 'load' });
    return { page, consoleErrors };
  }

  return { openPage };
}
