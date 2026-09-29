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
- un tronçon partagé est dessiné en voies parallèles, une par Véloligne (`LaneFeature`).

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
