# 9. Avancement et promesse des tronçons

Date : 2026-10-02
Statut : Accepté

## Contexte

Le statut d'un tronçon (`status`) mélange deux informations :

- **l'avancement** : réalisé (`done`), en travaux (`wip`), pas commencé ;
- **l'engagement** de la Métropole : `planned` (« prévu pour 2026 ») et `postponed` (« reporté après 2026 »).

Ces valeurs reprennent le plan officiel des Vélolignes (mai 2022, `assets/planOfficiel_2022-05-31.jpg`) :
trait plein « Horizon 2026 », pointillé « Au-delà de 2026 ».

Le mandat 2020-2026 est terminé et l'échéance est fixée à **fin 2026** (lecture la plus favorable à la
Métropole). Les mots ne disent plus la réalité :

- un tronçon `planned` non réalisé après l'échéance n'est plus « prévu » : il est promis et non réalisé ;
- un tronçon `postponed` n'a jamais été promis : « reporté » laisse croire à un engagement ;
- dès qu'un tronçon passe à `done`, on perd le fait qu'il était promis. On ne peut donc pas mesurer un
  retard, ni dire qu'un tronçon réalisé n'avait jamais été promis.

Ce qu'on veut afficher : le retard par rapport à la **première promesse**, y compris si le tronçon est
promis de nouveau par une prochaine mandature.

Alternatives examinées :

- Changer seulement les libellés : le code et les données gardent `planned` et `postponed`, qui ne disent
  plus la même chose que l'affichage, et la promesse se perd toujours à la réalisation.
- Un statut unique qui porte l'échéance (`promised-2026`, puis `promised-2032`) : simple, mais la
  promesse se perd à la réalisation ou à une nouvelle promesse. Le retard n'est plus mesurable.
- Une liste de promesses par tronçon (`promises: [2026, 2032]`) : garde tout l'historique, mais c'est
  plus lourd, pour un cas (une nouvelle promesse) qui n'existe pas encore.

## Décision

1. L'avancement et la promesse deviennent deux champs distincts.
   - `status` ne décrit que l'avancement : `done`, `wip`, `todo`, `unknown`. `planned`, `postponed`
     et les variantes héritées de Lyon (`variante`, `variante-postponed`, jamais utilisées à Montpellier)
     disparaissent.
   - `promisedFor` (facultatif) donne l'année de la **première** promesse. Seule valeur admise
     aujourd'hui : `2026`. Un champ absent veut dire « jamais promis » ; ni `null` ni `""`.
   - `promisedFor` ne change plus une fois posé : une nouvelle promesse ne le remplace pas.
2. Une promesse pour l'année N vaut jusqu'au 31 décembre de l'année N.
3. Migration des données, d'après le plan officiel :

   | Avant               | `status` | `promisedFor` |
   | ------------------- | -------- | ------------- |
   | `planned`           | `todo`   | `2026`        |
   | `postponed`         | `todo`   | absent        |
   | `wip`               | `wip`    | `2026`        |
   | `done`, trait plein | `done`   | `2026`        |
   | `done`, pointillé   | `done`   | absent        |

   Les tronçons réalisés avant 2021 sont en trait plein : ils faisaient partie du réseau promis pour 2026. La date de réalisation les distingue à l'affichage (« avant 2021 »).
   Deux tronçons réalisés étaient en pointillé : `VL B · Boirargues Mc Donald` (retrouvé `postponed` dans
   l'historique git) et `VL C · Saussan ⇄ Fabrègues` (relu sur le plan).

4. Libellés affichés :

   | Tronçon                                   | Libellé                            |
   | ----------------------------------------- | ---------------------------------- |
   | `done`, réalisé avant 2021                | réalisé avant 2021                 |
   | `done`, réalisé au plus tard à l'échéance | réalisé le jj/mm/aaaa              |
   | `done`, réalisé après l'échéance          | réalisé le jj/mm/aaaa, avec retard |
   | `wip`                                     | en travaux                         |
   | `todo` promis, avant l'échéance           | promis pour fin 2026               |
   | `todo` promis, après l'échéance           | promis pour 2026, non réalisé      |
   | `todo` sans promesse                      | sans échéance                      |

5. Le passage aux libellés « après l'échéance » se fait à la main, par une PR en janvier 2027. Le site
   est statique : un calcul à la génération ne changerait le texte qu'au déploiement suivant, et un
   calcul dans le navigateur ferait différer la page générée et la page affichée.

## Conséquences

- Le retard se mesure par rapport à la première promesse, que le tronçon soit réalisé ou non.
- Un tronçon réalisé sans avoir été promis reste identifiable.
- Une nouvelle promesse (mandature 2026-2032) n'est pas représentée : on n'affiche que le retard sur 2026. Si on veut l'afficher, `promisedFor` deviendra une liste `promises` (alternative 3) ; la
  migration consiste à mettre chaque valeur dans une liste.
- Le dessin de la carte ne change pas : un tronçon `todo` promis est dessiné comme l'ancien `planned`,
  un `todo` sans promesse comme l'ancien `postponed` (plus pâle). La légende, le filtre et le tableau de
  bord reprennent les nouveaux libellés.
- Contributeurs : le guide de modification depuis GitHub et la référence des données décrivent les deux
  champs. Le test de données refuse une valeur hors liste, et `promisedFor: null` ou `""`.
- Un rappel est nécessaire pour la PR de janvier 2027.
