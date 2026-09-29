# Guide : porter une feature de Cyclopolis

L'observatoire ne se synchronise plus avec Cyclopolis Lyon par merge : les features lyonnaises
retenues sont portées une par une (ADR 0002). Le formatage étant le même des deux côtés (`oxfmt`,
ADR 0007), un fichier porté ne diffère que par son contenu.

## Préparer le dépôt (une fois)

```bash
git remote add lyon https://github.com/lavilleavelo/cyclopolis.git
```

## Trouver la feature chez Lyon

```bash
git fetch lyon
git log --oneline lyon/main -- <chemin ou dossier concerné>
git show <sha>
```

Depuis le merge `-s ours` de septembre 2026 (PR #8), les commits lyonnais antérieurs sont marqués
comme intégrés : `git log montpellier/main..lyon/main` ne montre que les nouveautés.

## Choisir la façon de porter

| Situation                                                                | Méthode                                                                                                                     |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Fichiers nouveaux et autonomes (un composant, une page)                  | `git checkout lyon/main -- <fichier>`, puis adaptation.                                                                     |
| Commit petit et isolé                                                    | `git cherry-pick -n <sha>`, puis ajustement avant de committer.                                                             |
| Feature qui touche la carte (`Map.vue`, `useMap.ts`, `composables/map/`) | Réimplémentation dans notre code, en lisant le diff lyonnais comme une spécification : les deux codes de carte ont divergé. |

Points d'attention lors de l'adaptation :

- les données lyonnaises (`content/`) ne se portent pas : seules la structure et le code comptent ;
- les textes, noms (« Voies Lyonnaises » → « Vélolignes », via `config.json`) et adresses doivent
  être ceux de Montpellier ;
- une nouvelle dépendance se discute avant d'être ajoutée.

## Committer

Chaque commit de portage cite sa source :

```text
feat: tooltip au survol des tronçons

Porté depuis lyon@1a2b3c4 (« Tooltip au survol »), adapté aux tronçons
regroupés de domain/sections.ts.
```

## Vérifier

```bash
npm run format && npm run lint && npm run typecheck
npm test -- --run
npm run test:smoke
npm run test:e2e
```

Une feature de carte s'accompagne d'un test navigateur dans `tests/e2e/` (ADR 0006), écrit avant
le portage quand c'est possible ; les tests lyonnais de `tests/e2e/` peuvent servir de point de
départ.
