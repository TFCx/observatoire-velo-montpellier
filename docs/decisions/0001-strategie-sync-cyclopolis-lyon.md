# 1. Stratégie de synchronisation avec Cyclopolis Lyon

Date : 2026-09-28
Statut : Remplacé par [0002](0002-portage-manuel-features-cyclopolis.md)

## Contexte

L'observatoire de Montpellier est un fork de Cyclopolis (lavilleavelo/cyclopolis)
dont une partie importante du code a été réécrite. On souhaite continuer à
récupérer certaines features lyonnaises. La branche `sync/lyon/last` pointe sur
le dernier commit lyonnais pris en compte.

Historique des synchronisations :

- 2023 → avril 2024 : merges directs et fréquents de l'amont.
- nov. 2024 : merges « Pick » incrémentaux (branche `dev/sync_lyon`), chacun
  arrêté sur le commit lyonnais qui termine une feature.
- fév. 2025 : reprises sélectives par squash (branche `dev/retrieve_lyon`), sans
  parent lyonnais enregistré.

Les squashes de 2025 n'ont pas déplacé la base de merge : git considérait
encore 93 commits lyonnais comme absents et aurait représenté, à la sync
suivante, des conflits déjà tranchés. Les conflits récurrents sont :

- modify/delete sur les données lyonnaises supprimées côté Montpellier ;
- `composables/useMap.ts` et `components/Map.vue`, réécrits côté Montpellier.

## Décision

1. Un merge `-s ours` de `8336f85` (commit 4801b33) enregistre Lyon comme
   intégré jusqu'au 23/02/2025, sans modifier aucun fichier.
2. Les synchronisations suivantes se font par vrais merges incrémentaux
   (style « Pick ») de `sync/lyon/last`, jamais par squash, pour que la base de
   merge avance.
3. `git rerere` est activé pour rejouer les résolutions récurrentes.

## Conséquences

- Les prochains merges ne présentent que les changements lyonnais postérieurs
  à 8336f85.
- Une feature lyonnaise antérieure à 8336f85 non reprise ne sera plus proposée
  par git : il faudra la cherry-picker explicitement. Risque accepté.
- `rerere` est une config locale (`.git/config`) : à réactiver sur chaque clone.
- Le bruit modify/delete sur les données lyonnaises reste présent ; un script
  post-merge pourra l'automatiser si besoin (option écartée pour l'instant).
