# Explication : architecture de l'observatoire

Cette page explique comment l'observatoire est construit et pourquoi. Les décisions détaillées sont
dans [`docs/decisions/`](../decisions/) (ADR).

## Un site statique

L'observatoire est un site **entièrement statique** : `nuxt generate` produit à l'avance toutes les
pages HTML, que Netlify sert telles quelles. Il n'y a ni serveur applicatif ni base de données en
production, ce qui rend le site gratuit à héberger, rapide et sans maintenance de serveur.

Les données vivent dans le dépôt, sous `content/` : modifier une Véloligne, c'est modifier un
fichier, avec l'historique et la relecture de git. Le prix de ce choix : toute modification passe
par un nouveau build et un déploiement (quelques minutes, automatiques).

## Des données au site

```text
content/voies-cyclables/*.json ─┐                    ┌─ carte (MapLibre)
content/voies-cyclables/*.md  ──┼─ Nuxt Content ──────┼─ pages des Vélolignes
content/news, blog, …         ──┘  (au build)        └─ statistiques, tableau de bord
            │
            └─ validées par domain/schema.ts (tests/data-health.test.ts)
```

- **Nuxt Content** lit `content/` au moment du build et expose les fichiers comme des collections
  (`content.config.ts`) que les pages interrogent (`queryCollection`). Il ne valide pas les données :
  c'est le rôle du schéma.
- **`domain/`** contient la logique métier en TypeScript pur, sans Vue ni Nuxt, donc testable
  seule : le schéma des données (`schema.ts`, ADR 0008) et le regroupement des tronçons
  (`sections.ts`).
- Un **tronçon partagé** entre plusieurs Vélolignes est saisi dans le fichier de chacune d'elles
  avec le même `id` ; `regroupIntoSections` le réunit en un seul tronçon, pour ne pas le compter ni
  le dessiner deux fois.

## La carte

La carte utilise **MapLibre GL**, qui dessine en WebGL dans le navigateur. Le fond de carte vient
des tuiles vectorielles OpenMapTiles de la DINUM (`assets/style.json`) ; les Vélolignes sont
ajoutées par-dessus en couches GeoJSON :

- `components/Map.vue` crée la carte et ses contrôles (`maplibre/`) ;
- `composables/useMap.ts` et `composables/map/` dessinent le réseau selon la visualisation choisie
  (avancement, qualité, type, futur réseau) et gèrent les clics ;
- un tronçon partagé est dessiné en voies parallèles, une par Véloligne (`LaneFeature`) ;
- sur la carte interactive, les filtres (`useMapFilters`, `components/filter/FilterForm.vue`) s'affichent
  dans un panneau latéral à droite de la carte en grand écran (1024 px et plus, ADR 0010), et dans un
  bottom sheet en dessous (ADR 0011) ; les autres cartes les affichent dans une modale ;
- dans ce même panneau, un clic sur un tronçon de la carte interactive ouvre la page de sa Véloligne
  (`components/DetailPanel.vue`), sans sa carte d'aperçu, défilée jusqu'au titre de l'ancre du lien du
  tronçon ; la carte se cadre sur le tronçon, mis en évidence par un halo, et la section du texte qui en parle
  (son titre jusqu'au titre suivant de même niveau) est surlignée. Un tronçon partagé montre une pastille par
  Véloligne pour passer de l'une à l'autre ; il s'ouvre sur la première de ses Vélolignes. Sur les autres
  cartes, le clic ouvre un tooltip.

Le bottom sheet (`components/BottomSheet.vue`) monte du bas de l'écran, par-dessus la carte, à la moitié de
sa hauteur. On règle sa hauteur en glissant sa poignée ou l'en-tête de son contenu, entre 200 px et 90 % de
l'écran ; lâché sous 150 px, il se ferme. La carte reste en plein écran derrière lui : le tronçon est cadré
dans la partie visible au-dessus du bottom sheet à mi-hauteur, et recadré quand l'écran passe d'un côté à
l'autre de 1024 px. Ces règles sont des fonctions pures, dans `domain/bottomSheet.ts`.

L'état du panneau, latéral ou bottom sheet, est dans l'URL de la carte interactive, sur tous les écrans :

| URL                                           | Panneau                                     |
| --------------------------------------------- | ------------------------------------------- |
| `?panneau=filtres`                            | les filtres                                 |
| `?panneau=detail&troncon=<name>&ligne=<line>` | la page de la Véloligne `<line>` du tronçon |
| autre valeur, tronçon introuvable             | fermé                                       |

`ligne` est facultatif ; absent ou hors du tronçon, c'est la première Véloligne du tronçon.
`domain/mapPanel.ts` lit ces paramètres une seule fois et les convertit en un état typé. Le panneau change
l'URL sans ajouter d'entrée dans l'historique du navigateur. Les autres cartes (page d'une Véloligne,
carte intégrable) ne lisent pas l'URL.

Les pages des Vélolignes sont préchargées dans la page de la carte interactive (environ 20 Ko
compressés) : une requête au clic téléchargerait le moteur SQLite de Nuxt Content (environ 400 Ko).

MapLibre ne se charge que sur les pages qui ont une carte : les autres pages restent légères.

## Les vérifications

Chaque pull request passe par la CI GitHub (`.github/workflows/run_tests.yml`) :

| Vérification                   | Ce qu'elle protège                                                |
| ------------------------------ | ----------------------------------------------------------------- |
| Formatage, ESLint, typecheck   | Un code homogène et cohérent avec ses types (ADR 0007).           |
| Tests unitaires et des données | La logique métier et la validité de `content/` (ADR 0008).        |
| Smoke tests sur le site généré | Chaque page existe, avec son contenu, son titre, ses métadonnées. |
| Tests navigateur (Chromium)    | Les cartes se dessinent, sans erreur JavaScript (ADR 0006).       |

## Le déploiement

La CI construit le site, le teste, puis envoie **ce même build** à Netlify, qui ne sert que
d'hébergeur (ADR 0004) : aperçu pour chaque pull request, puis beta et production par le workflow
« Promote ». Voir le [guide de déploiement](../guides/deployer-en-beta-puis-en-production.md).

## La relation avec Cyclopolis

L'observatoire est né d'une copie (fork) de Cyclopolis, l'outil de La Ville à Vélo à Lyon. Les deux
projets ont divergé : Montpellier ne fusionne plus le code lyonnais, mais en reprend les features
choisies une par une (ADR 0002), sur la même stack Nuxt (ADR 0005) et avec le même formatage
(ADR 0007), pour que ces reprises restent simples. Voir le
[guide de portage](../guides/porter-une-feature-de-cyclopolis.md).

## Où trouver quoi

| Dossier              | Contenu                                                             |
| -------------------- | ------------------------------------------------------------------- |
| `content/`           | Données et textes (Vélolignes, actualités, blog, sites partenaires) |
| `domain/`            | Logique métier pure : schéma des données, regroupement des tronçons |
| `types/`             | Types TypeScript, en partie déduits du schéma                       |
| `pages/`, `layouts/` | Pages du site (une par adresse) et gabarits                         |
| `components/`        | Composants Vue ; `components/content/` : utilisables dans le texte  |
| `composables/`       | Logique partagée côté Vue (carte, statistiques, configuration)      |
| `maplibre/`          | Contrôles de la carte (boutons)                                     |
| `public/`            | Fichiers servis tels quels (images, icônes, `_redirects`)           |
| `tests/`             | Tests unitaires et des données, `smoke/`, `e2e/`                    |
| `scripts/`           | Scripts ponctuels (image de partage)                                |
| `docs/`              | Documentation et ADR                                                |
| `config.json`        | Noms, couleurs des lignes, adresse du site, lignes de tram          |
