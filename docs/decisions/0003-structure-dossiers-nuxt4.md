# 3. Structure des dossiers sous Nuxt 4 : garder la racine

Date : 2026-09-28
Statut : Accepté

## Contexte

Nuxt 4 place par défaut le code applicatif (pages, composants, composables, layouts,
middleware, plugins, assets) dans un dossier `app/`, séparé de `server/`, `content/` et
`public/`. Cette convention apporte une séparation plus nette entre code navigateur et code
serveur, avec des contextes TypeScript distincts.

Le projet est organisé à la racine, comme sous Nuxt 3. Cyclopolis Lyon a migré vers Nuxt 4
(#763) en gardant cette organisation (`srcDir: '.'`). Or l'ADR 0002 prévoit de porter des
features lyonnaises fichier par fichier (`git checkout lyon/main -- <fichier>`) : des chemins
identiques des deux côtés rendent ces portages directs.

## Décision

1. Sous Nuxt 4, le projet garde son organisation à la racine, via `srcDir: '.'` dans
   `nuxt.config.ts`.
2. Le passage à la convention `app/` reste souhaité à terme. Il se fera dans un commit de
   renommage pur (sans autre modification), quand les portages depuis Lyon seront devenus rares
   ou si Lyon adopte lui-même `app/`.

## Conséquences

- Migration vers Nuxt 4 limitée aux changements de comportement, sans renommage de fichiers.
- Les chemins restent alignés sur Lyon, ce qui facilite les portages de la phase 2 et 3.
- Le projet s'écarte de la convention décrite par la documentation Nuxt 4 : il faut garder
  `srcDir: '.'` en tête en lisant la doc ou des exemples.
- Le passage futur à `app/` produira un gros diff de renommage ; l'historique git des fichiers
  déplacés reste consultable avec `git log --follow`.
