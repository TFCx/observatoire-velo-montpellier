import { defineConfig } from 'vitest/config';

// Configuration séparée : les tests navigateur lisent le site généré (.output/public), qui n'existe
// qu'après `nuxt generate`, et lancent Chromium. Ils ne tournent donc pas avec `npm test`.
export default defineConfig({
  test: {
    include: ['tests/e2e/**/*.e2e.ts'],
    // Le rendu WebGL logiciel de Chromium sans carte graphique rend les cartes lentes à dessiner.
    testTimeout: 60_000,
    hookTimeout: 60_000,
    // Un seul Chromium et un seul serveur pour tous les fichiers de test.
    fileParallelism: false
  }
});
