Court terme :
- Ligne Marché du Lez
- Changer lien vers le communiqué officiel dans les news
- changer const BASE_URL = 'https://velocite-montpellier.fr';
const COVER_IMAGE_URL = 'https://observatoire-velo-montpellier.netlify.app/_nuxt/logoCyclopolisVGM.CzJjkGQi.png'; quand ce sere hébergé proprement
- liens cyclopolis
- mettre des liens vers le site des compteurs, Vigilo, le baromètre.. peut-être en bas en pied de page ?
- Cherry pick tableau de bord
- Renseigner un peu plus en détail Vélolignes C et D  (.md)

Moyen terme :
- Stats qualité première page
- Tableau de bord : essayer de rappatrier
- résoudre le bug de :line-link{line=X}
- Pimper les couleurs (principalement pour les types qui n'ont pas assez de contraste)
- Tester recolorisation Adwaita, 4 grands directions (N/E/W/S) + rocades
- Intégrer les carrefours
- Tester une catégorie "petits tronçons à faire en priorité"
- Ajout "envoyer une remarque" sur un tronçon. Comment le gérer ? Mail ?
- Autres lignes majeures (BT, T, VL70, ...)
- Avoir des groupes (vélolignes, majeures, connexions... ) ?
- Nouveau widget timeline
- Changer la limite avec un greyout hors du polygone
- Autres infos vélo (rue écoles, 30kmh, parking, ...)
- Lib : pinia a l'air cool (utilisé par Marseille)
- Problème perfs / leak
- Améliorer l'identité graphique

Long terme :
- Intégration topographie
- Aménagement sur 2 sens (éviter hétérogène)
- Visu à 2 lanes pour la qualité quelque soit le réseau
- Intégration compteurs
- Intégration Vigilo
- Intégration Baromètre des villes cyclables








================

Une section = 1 à N lanes

Actuellement :

- Des grey-dashes sur toutes les sections qui sont WIP ou Postponed :
- Un fond de couleur de la ligne pour toutes les sections en fin
- Un fond de couleur de la ligne pour toutes les sections sauf Postponed
- Un fond blanc légèrement plus petit sur toutes les sections sauf Postponed
- Un fond blanc très fin sur toutes les sections
- Un hover effect sur toutes les sections






Ce qu'on veut :
- Si avancement du projet :
  - Toutes les lanes Done en couleur ligne pleine
  - Toutes les lanes WIP en couleur ligne + blink
  - Bord noir en union Done + WIP
  - Toutes les lanes Planned en bord couleur ligne + dashes
  - Toutes les lanes Postponed en bord couleur ligne + dashes + transparence + /2 size + croix
- Si qualité :
  - Section done en couleur qualité avec bord nord
  - Section WIP en couleur qualité avec bord nord + blink
  - Le bord noir en union Done + WIP
  - Grey dashes sur Planned
  - Grey dashes + croix sur Postponed
- Si futur réseau :
  - Toutes les lanes en couleur ligne
  - Bord noir en union Done + WIP + Planned + Postponned