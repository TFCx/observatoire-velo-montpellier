# Guide : refaire l'image de partage

`public/og-image.png` est l'image affichée quand une page de l'observatoire est partagée sur un
réseau social (les pages des Vélolignes utilisent leur couverture, si elles en ont une). Elle montre
le bandeau de l'observatoire au-dessus de la carte du **réseau final** des Vélolignes : elle ne
change qu'à une révision du plan, pas au fil des travaux.

Pour la refaire, avec Internet (fond de carte) et Chromium installé
(`npx playwright-core install --only-shell chromium`) :

```bash
npm run og-image
```

Le script (`scripts/og-image.ts`) génère le site, affiche la carte embarquée en visualisation
« futur réseau », la compose avec le bandeau en 1200×630 pixels, et reprend l'attribution du fond de
carte qu'impose la licence OpenStreetMap. Vérifier l'image, puis la committer dans une pull request.
