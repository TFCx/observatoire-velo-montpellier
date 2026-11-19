# 11. Bottom sheet de la carte sur les petits écrans

Date : 2026-11-19
Statut : Accepté, implémenté (PR 52). Remplace le point 4 de l'ADR 0010.

## Contexte

Le panneau latéral de la carte interactive (ADR 0010) n'existe qu'à partir de 1024 px. En dessous, la
carte garde la modale des filtres, qui cache la carte, et un popup au clic sur un tronçon, qui ne donne
qu'un résumé et un lien vers la page de la Véloligne. L'URL du panneau y est ignorée : un lien vers un
tronçon, partagé depuis un ordinateur, n'ouvre que la carte sur un téléphone.

Cyclopolis (Lyon) affiche les filtres et le détail d'une Voie Lyonnaise dans un bottom sheet sur les
petits écrans : un panneau qui monte du bas de l'écran, par-dessus la carte, et dont on règle la hauteur
au doigt. Son URL y est lue comme en grand écran.

Alternatives examinées pour l'URL :

- L'ignorer sous 1024 px, comme aujourd'hui, et donner au bottom sheet un état interne : un lien partagé
  n'ouvre que la carte, et deux états à synchroniser quand la fenêtre change de taille. Écartée.
- La lire et l'écrire comme en grand écran : retenue.

Alternatives examinées pour la hauteur du bottom sheet :

- Hauteur fixe, fermeture par la croix : la page d'une Véloligne se lit à l'étroit.
- Deux crans (moitié et presque tout l'écran) : un geste plus net, mais plus de code et un écart avec
  Cyclopolis.
- Hauteur libre au doigt, comme Cyclopolis : retenue.

Alternative examinée pour la carte : la rétrécir au-dessus du bottom sheet, comme le panneau latéral la
rétrécit. MapLibre suit la taille de son conteneur : la carte se redimensionnerait à chaque pixel du
glisser, ce qui saccade et déplace la vue. Écartée.

## Décision

1. Sous 1024 px, la carte interactive affiche dans un bottom sheet ce que le panneau latéral affiche en
   grand écran : les filtres, ou le détail d'un tronçon (même contenu, mêmes pastilles des Vélolignes,
   même défilement jusqu'à l'ancre et même surlignage). Le bottom sheet remplace la modale des filtres et
   le popup au clic de la carte interactive. Les autres cartes gardent la modale et le popup (ADR 0010,
   point 5).
2. L'URL est lue et écrite sur tous les écrans, avec les paramètres de l'ADR 0010 (point 3). Le même état
   s'affiche dans le panneau latéral à partir de 1024 px, dans le bottom sheet en dessous.
3. Le bottom sheet s'ouvre à la moitié de la hauteur de l'écran. On règle sa hauteur au doigt (ou à la
   souris) en glissant sa poignée ou son en-tête, entre 200 px et 90 % de l'écran ; lâché sous 150 px, il
   se ferme, et l'URL avec lui. Son contenu défile à l'intérieur.
4. La carte reste en plein écran derrière le bottom sheet. Le tronçon sélectionné est cadré dans la
   partie de la carte visible au-dessus du bottom sheet ouvert à mi-hauteur. Le glisser ne recadre pas la
   carte.
5. Quand l'écran passe d'un côté à l'autre de 1024 px avec le détail ouvert (fenêtre redimensionnée,
   tablette tournée), la carte recadre le tronçon avec la marge du nouvel affichage.

## Conséquences

- La modale des filtres et le `watch` qui la faisait passer dans le panneau latéral à l'agrandissement
  disparaissent de la carte interactive.
- Le panneau de détail ne suppose plus que c'est lui qui défile : le défilement jusqu'à l'ancre et le
  surlignage portent sur la zone qui défile, panneau latéral ou intérieur du bottom sheet.
- Le cadrage d'un tronçon prend une marge qui dépend de l'affichage.
- Le popup au clic de la carte interactive n'existant plus, la question de l'ordre de
  `SectionFeature.links` (`TODO.md`) ne concerne plus que les autres cartes.
- Le bottom sheet est écrit à partir de celui de Cyclopolis (`components/BottomSheet.vue`), lu comme une
  spécification (ADR 0002).

## Questions tranchées

- URL lue sur téléphone : oui, comme en grand écran.
- Hauteur : libre au doigt, comme Cyclopolis ; carte en plein écran derrière.
- Passage d'un écran à l'autre, détail ouvert : la carte recadre le tronçon.
- Les filtres s'ouvrent aussi à mi-hauteur (Cyclopolis : 30 %) : nos filtres occupent environ 440 px sur
  un téléphone de 800 px de haut.
- Le bottom sheet ouvert garde la hauteur réglée par la personne quand elle clique sur un autre tronçon ;
  il revient à mi-hauteur à chaque nouvelle ouverture.
- Le seuil reste 1024 px : une tablette en portrait (768 à 1023 px) et un téléphone en paysage ont le
  bottom sheet.
- Le bottom sheet monte du bas en glissant à l'ouverture et redescend à la fermeture (300 et 200 ms,
  comme Cyclopolis). Pas de voile sombre sur la carte : elle reste utilisable au-dessus.
