import { defineConfig } from 'vitest/config';

// Configuration séparée : les smoke tests lisent le site généré (.output/public), qui n'existe
// qu'après `nuxt generate`. Ils ne doivent donc pas tourner avec les tests unitaires de `npm test`.
export default defineConfig({
  test: {
    include: ['tests/smoke/**/*.smoke.ts'],
  },
});
