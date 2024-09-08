Court terme :
- Changer lien vers le communiqué officiel dans les news
- changer const BASE_URL = 'https://velocite-montpellier.fr';
const COVER_IMAGE_URL = 'https://observatoire-velo-montpellier.netlify.app/_nuxt/logoCyclopolisVGM.CzJjkGQi.png'; quand ce sere hébergé proprement
- Les changmements de taille du logo au scroll / sous mobile => bof
- Texte :
  - adhérer à Vélocité => texte à changer (nico le donnera)
  - lien adhérer mort => NON, testé ce jour
  - liens cyclopolis
- Déplacer sur observatoire.velocite-montpellier.fr
- mettre des liens vers le site des compteurs, Vigilo, le baromètre.. peut-être en bas en pied de page ?
- Problème perfs / leak
- Cherry pick tableau de bord
- Stats qualité première page
- Renseigner un peu plus en détail Vélolignes C et D  (.md)
- Tableau de bord : essaye

Moyen terme :
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

Long terme :
- Intégration topographie
- Aménagement sur 2 sens (éviter hétérogène)
- Visu à 2 lanes pour la qualité quelque soit le réseau
- Intégration compteurs
- Intégration Vigilo
- Intégration Baromètre des villes cyclables