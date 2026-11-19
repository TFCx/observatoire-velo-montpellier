# Handoff

Date : 2026-11-19 · Branche : `mobile-bottom-sheet` · S'appuie sur `90e25d6b` (merge de la PR 51)

## Où on en est

Le panneau latéral de la carte interactive (ADR 0010, PR 49 à 51) est sur `montpellier/main` et sur
beta (`90e25d6b`). **Il n'est volontairement pas en production** : Jean-David ne veut pas multiplier
les news. La prod attendra le bottom sheet, pour une seule news et une seule promotion beta → prod.

## Prochaine étape : bottom sheet mobile

Sous 1024 px, la carte interactive garde la modale des filtres et le tooltip au clic (ADR 0010,
point 4). Objectif : y afficher les filtres et le détail d'un tronçon dans un bottom sheet (panneau qui
monte du bas de l'écran), comme Cyclopolis.

Critère de réussite : sur un téléphone (390 px), `/carte-interactive?panneau=filtres` et
`/carte-interactive?panneau=detail&troncon=Chemin%20des%20Alouettes&ligne=B` ouvrent le bottom sheet ; le
clic sur un tronçon l'ouvre ; captures avant/après sur téléphone, tests navigateur vus rouges.

Avant le code, des décisions à faire trancher par Jean-David, puis un ADR (le point 4 de l'ADR 0010
change : nouvel ADR qui le remplace, ou erratum) :

- l'URL est-elle lue sur téléphone comme en grand écran (aujourd'hui ignorée sous 1024 px) ;
- hauteurs du bottom sheet (Cyclopolis : moitié de l'écran par défaut, déplaçable au doigt) et ce que
  devient la carte derrière (cadrage sur le tronçon dans la partie visible) ;
- passage d'un écran à l'autre (le panneau latéral et la modale se passent déjà la main à
  l'agrandissement : `components/Map.vue`, watch sur `isLargeScreen`).

## À lire

- Cyclopolis (remote `lyon`) : `git show lyon/main:components/BottomSheet.vue` (176 lignes, glisser
  au doigt), ses usages dans `components/FilterPanel.vue` et `components/DetailPanel.vue`, commits
  `9fbffb5b` et `ec6e7345`. Portage manuel (ADR 0002) : lire comme une spécification.
- Chez nous : `components/Map.vue` (option `sidePanel`, `isFilterPanelShown`, `detailPanel`, gardés
  par `isLargeScreen`), `components/DetailPanel.vue` (son défilement et son surlignage supposent que
  le panneau lui-même défile), `components/filter/FilterForm.vue`, `composables/useIsLargeScreen.ts`,
  `domain/mapPanel.ts`.
- Tests : `tests/e2e/filters.e2e.ts` et `tests/e2e/detail.e2e.ts` ont des tests « petit écran » qui
  vérifient l'absence de panneau ; ils changeront avec la décision sur l'URL.

## Questions ouvertes (aussi dans `TODO.md`)

- Clic sur un titre du panneau de détail pour sélectionner ses tronçons : une ancre désigne souvent
  plusieurs tronçons. Piste de Jean-David : une bijection parfaite entre titres et tronçons.
- `SectionFeature.links` n'est pas dans l'ordre de `lines` : le tooltip du clic (petits écrans)
  renvoie au premier lien saisi. À régler si le bottom sheet remplace ce tooltip.

## Pièges de la session précédente

- Tests navigateur : le rendu de la carte varie d'une capture à l'autre (animation du cadrage), et
  les couleurs de nos couches se retrouvent partout. Ni comparaison de captures ni comptage d'une
  couleur précise : compter les couleurs distinctes dans une vue où le reste est vide, ou lire un
  attribut posé par le code (`data-selected-section` sur `#map`).
- Une `flex item` ne rétrécit pas sous son contenu : la carte a `min-h-0`, sinon une page longue dans
  un panneau l'étire sous la fenêtre.
- MapLibre suit lui-même la taille de son conteneur (`ResizeObserver`) : pas de `map.resize()`.
- Captures avec le vrai fond de carte : le script de la session précédente servait le site généré avec
  `tests/e2e/browser.ts` (`startStaticServer`, `launchChromiumWithWebgl2`) ; le navigateur intégré de
  l'app n'a pas WebGL.

## Pistes écartées

- Charger la page de la Véloligne au clic (requête Nuxt Content) : télécharge le moteur SQLite (~400 Ko
  compressés). Pages préchargées par la carte : +8 Ko compressés.
- Choisir la Véloligne d'un tronçon partagé d'après le trait cliqué : un seul trait dans les vues
  qualité et type, traits de 4 px sur un contour commun en vue avancement.
