# 7. Outillage : lint, formatage et typecheck alignés sur Lyon

Date : 2026-09-29
Statut : Accepté

## Contexte

Le projet a hérité de Cyclopolis une configuration ESLint 8 (`@nuxtjs/eslint-config-typescript`,
`.eslintrc`) et un `.prettierrc`, sans que ni l'un ni l'autre ne soit lancé en CI. Mesuré le
2026-09-29 : 2 013 erreurs ESLint, dont environ 90 % de mise en forme (indentation, guillemets,
points-virgules) et environ 150 vrais problèmes (`prefer-const`, `==` au lieu de `===`, variables
inutilisées). La configuration ESLint 8 porte aussi les 6 dernières vulnérabilités signalées par
`npm audit` (dépendances de développement).

Aucune vérification de types n'est faite : `tsc` relève 83 erreurs dans les seuls fichiers `.ts`,
les `.vue` n'étant pas vérifiés. Le `tsconfig.json` est resté au format Nuxt 3.

Cyclopolis Lyon est passé à ESLint 9 avec `@nuxt/eslint` 1.15, `eslint-config-prettier` et le
formateur `oxfmt`, qui exclut `content/`. Il n'a pas de typecheck.

Alternatives examinées :

- Prettier comme formateur (déjà présent) : plus mûr qu'`oxfmt` (version 0.x), mais un formatage
  qui ne serait pas strictement celui de Lyon.
- `oxlint` à la place d'ESLint : très rapide, mais prise en charge des fichiers `.vue` encore
  partielle.

## Décision

1. Formatage par `oxfmt`, avec la configuration de Lyon : un fichier porté depuis Cyclopolis
   (ADR 0002) n'arrive pas avec des différences de pure mise en forme. `content/` et `public/`
   sont exclus : les données des contributeurs ne sont jamais reformatées.
2. Lint par ESLint 10 et `@nuxt/eslint` (sa version actuelle, 1.17, requiert ESLint 10 ; Lyon
   reste en 9 avec une version plus ancienne du module), avec `eslint-config-prettier` pour
   laisser la mise en forme au formateur, et nos règles actuelles.
3. Typecheck par `nuxi typecheck` (`vue-tsc`), avec la structure `tsconfig` de Nuxt 4, qui
   sépare le code du navigateur et le code exécuté par Node (tests, scripts, configuration).
4. Mise en place en trois PR : outils et formatage (un commit de formatage pur, ignoré par
   `git blame` via `.git-blame-ignore-revs`), puis corrections du lint, puis typecheck. Chaque
   vérification devient bloquante en CI une fois le code conforme, dans un job `lint` séparé des
   tests.

## Conséquences

- Code homogène, formaté automatiquement (`npm run format`) ; plus de débat de mise en forme.
- Les ports depuis Lyon gardent des différences lisibles.
- Des erreurs de types et de logique sont détectées avant le merge.
- Le commit de formatage touche presque tout le code : une branche ouverte en même temps aura des
  conflits (pas sur `content/`).
- `oxfmt` est jeune : ses mises à jour peuvent changer le formatage ; elles se font comme les
  autres, par une PR dependabot vérifiée en CI.
