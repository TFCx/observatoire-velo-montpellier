# 8. Schéma unique des données des Vélolignes

Date : 2026-09-29
Statut : Accepté

## Contexte

La forme d'un tronçon de Véloligne (feature GeoJSON de `content/voies-cyclables/*.json`) est
décrite à trois endroits qui ne concordent pas :

- `types/index.ts` : types TypeScript écrits à la main, en partie faux (`quality` obligatoire alors
  qu'elle manque sur 27 tronçons et vaut `""` sur 49, `id` sans le cas `null`) ;
- `content.config.ts` : schéma de collection volontairement vague (`features: z.array(z.any())`),
  Nuxt Content ne validant de toute façon pas les données (constaté le 2026-09-28) ;
- `tests/data-health.test.ts` : une règle écrite à la main par propriété (statut connu, type connu,
  format de `doneAt`, champs requis), et un type `RawFeature` de plus.

Le typecheck (ADR 0007) a rendu l'écart visible : conversions forcées (`as unknown as Geojson[]`)
et types contournés dans les tests.

Alternatives examinées :

- Corriger les types à la main et garder les règles de test : l'écart reviendrait à la prochaine
  évolution des données, rien ne reliant les types aux vérifications.
- Un JSON Schema : validable, mais les types TypeScript devraient être générés par un outil de plus.

## Décision

1. La forme des données est décrite une seule fois, par des schémas zod dans `domain/schema.ts`,
   fidèles aux données brutes (sans transformation) : ce que contiennent les fichiers, y compris
   les valeurs vides admises (`quality` absente ou `""`, `doneAt` à `""` hors tronçons réalisés).
2. Les types TypeScript des données (`LineStringFeature`…) en sont déduits (`z.infer`).
3. `tests/data-health.test.ts` valide chaque fichier avec ces schémas ; restent des tests à part
   les règles qui relient plusieurs données (liens vers un titre existant, `id` partagé, unicité).
4. `content.config.ts` utilise les mêmes schémas pour typer les collections.
5. `zod` devient une dépendance explicite (même version que celle utilisée par Nuxt Content).

## Conséquences

- Un seul endroit à modifier quand les données évoluent (ex. nouveau statut).
- Le typecheck oblige le code à gérer les valeurs vides réelles.
- Un contributeur qui saisit une valeur invalide obtient en CI un message précis (fichier,
  tronçon, champ, valeurs admises).
- Les données calculées par le code (tronçons regroupés, voies) gardent des types propres, bâtis
  sur les types déduits.

## Erratum (2026-10-01)

Le schéma de l'en-tête (frontmatter) des pages des Vélolignes (`content/voies-cyclables/*.md`) rejoint
aussi `domain/schema.ts` (`velolignePageFrontmatterSchema`), utilisé par `content.config.ts`.
`tests/data-health.test.ts` le valide en mode strict : un champ inconnu est refusé. Le mode strict reste
propre au test, Nuxt Content ajoutant ses propres champs aux pages. L'en-tête est lu avec `yaml`
(devDependency), la bibliothèque qu'utilise Nuxt Content, pour que le test lise les mêmes valeurs que le site.
