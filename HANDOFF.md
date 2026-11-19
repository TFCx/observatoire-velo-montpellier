# Handoff

Date : 2026-11-19 · Branche : `claude/mobile-bottom-sheet-668c96` · S'appuie sur `a564205b` (corrections de la review croisée)

## Où on en est

Le bottom sheet mobile de la carte interactive (ADR 0011) est dans sa PR, vers `montpellier/main`. Avec lui,
le panneau latéral (ADR 0010, déjà en beta) et le bottom sheet forment une seule feature, **pas encore en
production** : Jean-David veut une seule news et une seule promotion beta → prod pour les deux.

## Prochaine étape : de la PR à la production

1. Fusion de la PR 52 (review croisée Codex faite, deux findings corrigés).
2. Promotion main → beta (confirmation de Jean-David juste avant), vérification par Jean-David sur un vrai
   téléphone : glisser au doigt, défilement du contenu, carte derrière.
3. Promotion beta → prod avec la news, quand Jean-David la décide.

Critère de réussite : la balise `observatoire-build` de la prod donne le commit de la fusion, et
`/carte-interactive?panneau=detail&troncon=Chemin%20des%20Alouettes&ligne=B` ouvre le bottom sheet sur un
téléphone.

## Questions ouvertes (aussi dans `TODO.md`)

- Sur téléphone, la légende « Visualisation » (environ 250 px de haut) recouvre la moitié de la carte visible
  au-dessus du bottom sheet, et souvent le tronçon cadré (capture de la PR). Légende repliable sur petit
  écran, ou marge du haut du cadrage qui en tient compte : à faire trancher, peut-être avant la prod.
- Téléphone en paysage : la marge du cadrage peut dépasser la hauteur de la carte. Non vérifié.
- Toujours ouverte : cliquer sur un titre du panneau de détail pour sélectionner ses tronçons.

## Pièges de la session

- Le glisser se teste à la souris dans Chromium (`page.mouse`) : le bottom sheet utilise les événements
  pointer, qui couvrent doigt et souris. Le doigt n'a été vérifié que par ce biais, jamais sur un appareil.
- Captures avec le vrai fond de carte : `findNetworkPoint` (tests) suppose un fond uni et clique à côté des
  tronçons ; viser un point relevé sur une capture. Pour une capture « avant », générer l'ancienne version
  dans un dossier temporaire (`git archive montpellier/main | tar -x`, `node_modules` en lien symbolique).
- `map.resize()` n'est appelé qu'à un endroit : avant le recadrage au changement d'affichage, pour que
  MapLibre cadre avec la nouvelle taille de la carte au lieu d'attendre son `ResizeObserver`.
- Filtres et détail s'excluent : un tronçon sélectionné masqué par les filtres n'est plus atteignable par
  l'interface. Le test du halo y arrive par le routeur de l'application (`replaceRouteQuery`).

## Pistes écartées

- Rétrécir la carte au-dessus du bottom sheet : MapLibre se redimensionnerait à chaque pixel du glisser.
- Crans de hauteur (50 % / 90 %) ou hauteur fixe : voir l'ADR 0011.
