# 2. Divergence assumée : portage manuel des features de Cyclopolis

Date : 2026-09-28
Statut : Accepté
Remplace : [0001](0001-strategie-sync-cyclopolis-lyon.md)

## Contexte

L'ADR 0001 prévoyait de suivre Cyclopolis Lyon par merges incrémentaux.
L'analyse de l'amont depuis 8336f85 (fév. 2025) montre :

- 622 commits, dont une migration de stack : @nuxt/content v3 (#588,
  avril 2025), Nuxt 4, Node 24, MapLibre 5 (#763–#766, nov. 2025) ;
- 173 fichiers de code modifiés, dont une réécriture de fait de
  `composables/useMap.ts` (~1 900 lignes) et de `components/Map.vue`,
  incompatibles avec la réécriture faite côté Montpellier.

Par ailleurs, les objectifs divergent : Cyclopolis se concentre sur le REV
lyonnais, alors que l'observatoire de Montpellier vise l'ensemble du réseau
cyclable (existant et à venir, type SDMA) et une plateforme de publication
pour les analyses de Vélocité. Le code de carte montpelliérain est jugé plus
lisible et est conservé.

## Décision

1. On ne synchronise plus avec Lyon par merge. Cyclopolis devient une source
   d'inspiration.
2. La montée de stack (Content v3, Nuxt 4, MapLibre 5) est faite par nous,
   par paliers validés par des tests, en s'appuyant sur les diffs lyonnais
   comme modèle.
3. Une fois la stack montée, un merge `-s ours` sur `lyon/main` recale la base
   de merge, pour que git ne propose plus les commits lyonnais antérieurs.
4. Les features lyonnaises retenues sont portées une par une, selon le cas :
   - fichiers nouveaux et autonomes : `git checkout lyon/main -- <fichier>`,
     puis adaptation ;
   - commit petit et isolé : `git cherry-pick -n <sha>`, puis ajustement ;
   - feature touchant la carte : réimplémentation dans notre code, le diff
     lyonnais servant de spécification.
5. Chaque commit de portage cite sa source (`porté depuis lyon@<sha>`).

## Conséquences

- Plus de conflits massifs à trancher : chaque portage est un changement
  maîtrisé, relu et testé.
- Les correctifs lyonnais ne nous parviennent plus automatiquement : il faut
  surveiller l'amont (`git fetch lyon`) et décider au cas par cas.
- `git log --grep=lyon@` donne la liste de ce qui a été repris.
- Le remote `lyon` et `git rerere` restent utiles pour les cherry-picks.
- Les montées de version futures (Nuxt, Content, MapLibre) sont à notre
  charge.
