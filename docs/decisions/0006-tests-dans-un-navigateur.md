# 6. Tests dans un navigateur : vitest et playwright-core

Date : 2026-09-29
Statut : Accepté

## Contexte

Les tests existants ne voient pas ce qui se passe dans un navigateur : tests unitaires,
tests de données, et smoke tests qui lisent le HTML généré. Lors du passage à MapLibre 6,
ils sont restés verts alors que toutes les cartes du site étaient vides : le worker de
MapLibre ne se chargeait plus, ce qui n'apparaît qu'à l'exécution du JavaScript.

Les phases 2 et 3 (ADR 0002) vont surtout modifier les cartes. Sans test dans un navigateur,
chaque portage demande une vérification manuelle de toutes les pages.

Cyclopolis Lyon a des tests `tests/e2e` avec vitest et `playwright-core`, lancés en local
seulement. Leur test de carte vérifie qu'un `<canvas>` existe, ce qui était vrai même avec
la carte vide.

Alternatives examinées :
- `@playwright/test`, le runner officiel : plus complet (attentes automatiques, traces,
  captures d'écran, lancement du serveur), mais un second outil de test à côté de vitest, et
  des tests moins proches de ceux de Lyon.
- Servir le site avec `npx serve` comme Lyon : une dépendance téléchargée à la volée à chaque
  exécution, sans version fixée.

## Décision

1. Les tests navigateur utilisent vitest et `playwright-core` (Chromium), comme Lyon, dans
   `tests/e2e/`, avec une configuration vitest séparée.
2. Ils testent le site généré (`nuxt generate`), servi par un petit serveur statique écrit
   avec `node:http`, sans dépendance.
3. Ils tournent en CI après les smoke tests, sur le même site généré.
4. Un test de carte vérifie que la carte est **dessinée** (variété des couleurs du canvas),
   pas seulement que le canvas existe, et qu'aucune erreur n'apparaît dans la console.

## Conséquences

- Une carte vide ou une erreur JavaScript bloque la PR.
- Chromium (~115 Mo) doit être téléchargé une fois en local (`npx playwright-core install
  chromium`) et en CI (mis en cache).
- Environ une minute de plus par exécution de la CI.
- Le fond de carte vient d'Internet (tuiles OpenMapTiles) : les tests dépendent du réseau ;
  les vérifications portent sur nos propres couches, chargées localement.
- Les tests de Lyon se portent en adaptant seulement la fonction d'accès aux pages.
