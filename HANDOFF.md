# Handoff

Date : 2026-11-19 · Branche : `panneau-lateral-detail` (PR 51) · S'appuie sur `78ef0c1a`

## Où on en est

Le panneau latéral de la carte interactive (ADR 0010) est terminé en trois PR : 49 (ADR et composant de
détail), 50 (filtres), 51 (détail d'un tronçon, cadrage, halo, surlignage de la section). Rien n'est
encore promu sur beta.

## Prochaine étape

Promouvoir main → beta avec le workflow Promote (`docs/guides/deployer-en-beta-puis-en-production.md`),
après confirmation de Jean-David, puis le laisser vérifier sur beta.

Critère de réussite : la balise `observatoire-build` de beta porte le commit de fusion de la PR 51, et
Jean-David a validé sur beta, en grand écran et sur téléphone, `/carte-interactive?panneau=filtres` et
`/carte-interactive?panneau=detail&troncon=Chemin%20des%20Alouettes&ligne=B`.

## Questions ouvertes

- Clic sur un titre du panneau de détail pour sélectionner ses tronçons : une ancre désigne souvent
  plusieurs tronçons. Piste de Jean-David : une bijection parfaite entre titres et tronçons. Noté dans
  `TODO.md`.
- `SectionFeature.links` n'est pas dans l'ordre de `lines` : le tooltip du clic (petits écrans) renvoie
  au premier lien saisi. Noté dans `TODO.md`.

## Pistes écartées

- Charger la page de la Véloligne au clic (requête Nuxt Content) : télécharge le moteur SQLite (~400 Ko
  compressés). Préchargement retenu : +8 Ko compressés pour la page de la carte.
- Tester la mise en évidence par comparaison de captures : deux captures de la même vue diffèrent
  (animation du cadrage). Compter une couleur précise ne marche pas non plus : celle du halo se
  retrouve ailleurs sur la carte. Les tests comptent les couleurs distinctes dans une vue où le reste
  est vide, ou lisent `data-selected-section`.
- Choisir la Véloligne d'un tronçon partagé d'après le trait cliqué : un seul trait dans les vues
  qualité et type, traits de 4 px sur un contour commun en vue avancement (ADR 0010).
