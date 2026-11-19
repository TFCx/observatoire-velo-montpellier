# 10. Panneau latéral de la carte, état dans l'URL

Date : 2026-11-18
Statut : Proposé

## Contexte

Sur la carte interactive, les filtres s'ouvrent dans une modale qui cache la carte, et un clic sur un
tronçon ouvre un popup qui ne donne qu'un résumé : statut, longueur, type, qualité, et un lien vers la
page de la Véloligne, ouverte dans un nouvel onglet.

Cyclopolis (Lyon) a remplacé ces deux interactions par un panneau latéral, sur les écrans d'au moins
1024 px :

- les filtres s'y affichent sans cacher la carte ;
- un clic sur un tronçon y affiche la page de sa Voie Lyonnaise, défilée jusqu'au passage qui parle du
  tronçon, et met le tronçon en évidence sur la carte ;
- l'état du panneau (ouvert ou non, sur quoi) est dans l'URL de la page.

Nos données le permettent : chaque tronçon a un champ `link` vers la page de sa Véloligne, avec une ancre
vers un titre de cette page pour 203 tronçons sur 211 (relevé du 18/11/2026).

Alternatives examinées pour le contenu du panneau de détail :

- Une fiche du tronçon (le popup actuel, en plus grand) : simple, mais elle n'apporte presque rien de
  plus que le popup. Écartée : on veut un résultat proche de Cyclopolis.
- La page de la Véloligne, comme Cyclopolis : retenue.

Alternatives examinées pour l'état du panneau :

- Un état interne au composant de la carte : plus simple, mais aucun lien ne peut ouvrir la carte sur un
  tronçon.
- L'URL de la page : un lien partagé rouvre la carte dans le même état, et les futures features
  (géocodeur, chronologie des livraisons) pourront renvoyer vers un tronçon de la carte. Retenue.

## Décision

1. La carte interactive (`/carte-interactive`) a un panneau latéral à droite, sur les écrans d'au moins
   1024 px. La carte rétrécit pour lui laisser la place. Le panneau affiche une seule chose à la fois :
   les filtres, ou le détail d'un tronçon.
2. Le détail d'un tronçon est la page de sa Véloligne (celle de son `link`), sans sa carte d'aperçu,
   défilée jusqu'à l'ancre du `link` quand il en a une. Le tronçon cliqué est mis en évidence sur la
   carte. Un bouton ouvre la page complète.

   Un tronçon partagé entre plusieurs Vélolignes a un `link` par Véloligne (11 tronçons le 18/11/2026,
   par exemple « Chemin des Alouettes » sur les Vélolignes 1 et B). Le panneau affiche d'abord la page de
   la première Véloligne dans l'ordre de `lines` (déjà trié : 1 avant B). Son en-tête montre une pastille
   par Véloligne ; un clic sur une pastille affiche la page de cette Véloligne, défilée jusqu'à l'ancre de
   son `link`. Le clic sur la carte ne choisit pas la Véloligne : dans les vues qualité et type, un
   tronçon partagé n'est qu'un seul trait, et dans la vue avancement le trait de chaque Véloligne ne fait
   que 4 px de large, sur un contour commun que le clic renvoie aussi.

3. L'état du panneau est dans les paramètres de l'URL :

   | État                | URL                                                             |
   | ------------------- | --------------------------------------------------------------- |
   | Panneau fermé       | `/carte-interactive`                                            |
   | Filtres             | `/carte-interactive?panneau=filtres`                            |
   | Détail d'un tronçon | `/carte-interactive?panneau=detail&troncon=<name>`              |
   | Détail, autre ligne | `/carte-interactive?panneau=detail&troncon=<name>&ligne=<line>` |

   `troncon` est le `name` du tronçon. La carte regroupe les tracés d'un tronçon partagé par leur `id`
   (`regroupIntoSections`), et un test de données impose déjà le même `name` aux tracés d'un même `id`.
   Pour que `name` désigne un seul tronçon, un test de données vérifie aussi que deux tronçons distincts
   (`id` différents, ou sans `id`) n'ont jamais le même `name`.

   `ligne` est facultatif : absent, le panneau affiche la première Véloligne du tronçon. L'URL est lue
   une fois, à l'entrée, et convertie en un état typé ; une valeur inconnue ou un tronçon introuvable
   donne « panneau fermé », une `ligne` qui ne passe pas par le tronçon donne sa première Véloligne.

   L'URL change par `router.replace`, comme chez Cyclopolis : ouvrir, changer ou fermer le panneau
   n'ajoute pas d'entrée dans l'historique, et le bouton retour du navigateur quitte la carte. Avec
   `router.push`, le bouton retour aurait fermé le panneau, mais chaque clic sur un tronçon aurait ajouté
   une entrée, et revenir à la page précédente aurait demandé autant de retours.

4. Sous 1024 px, rien ne change : modale des filtres et popup. Le bottom sheet mobile est une autre
   tâche (`TODO.md`, phase 3).
5. Les autres cartes (aperçu d'une Véloligne, `/carte-interactive/embed`, tableau de bord) gardent la
   modale et le popup.

## Conséquences

- Le contenu de `pages/[_slug]/index.vue` sort dans un composant, utilisé par la page et par le panneau,
  avec une option pour ne pas afficher la carte d'aperçu (une carte dans la carte).
- La carte doit suivre l'URL dans les deux sens : un clic change l'URL, et une URL ouverte directement
  ouvre le panneau et met le tronçon en évidence.
- Le défilement s'appuie sur les ancres des `link`, que le test de données
  `should_link_to_existing_title_anchor_when_feature_is_line_string` vérifie déjà.
- On ne réutilise pas les noms de paramètres de Cyclopolis (`modal`, `line`, `sectionName`) : le portage
  est manuel (ADR 0002) et nos URL sont en français.

## Questions tranchées

- Noms des paramètres : `panneau`, `troncon`, `ligne`, en français et sans accent.
- Le popup disparaît au clic quand le panneau s'ouvre (grand écran) : le panneau le remplace. Le tooltip
  au survol reste.
- Le panneau des filtres n'est pas ouvert par défaut. Cyclopolis l'ouvre par défaut sur grand écran.
- Seuil de 1024 px détecté par un petit composable sur `window.matchMedia`, sans ajouter `@vueuse/core`.
