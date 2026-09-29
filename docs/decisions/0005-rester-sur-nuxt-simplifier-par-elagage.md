# 5. Rester sur Nuxt, simplifier par élagage

Date : 2026-09-29
Statut : Accepté

## Contexte

Le projet est un fork de Cyclopolis Lyon : il en hérite un framework complet (Nuxt, Nuxt
Content, Tailwind) et du code écrit pour Lyon qui ne sert pas à Montpellier. Il n'a qu'un
mainteneur-développeur, avec peu de temps, et un ou deux contributeurs qui modifient le
contenu (`.md`, parfois `.json`/`.geojson`).

L'objectif est un projet plus léger, plus rapide et plus simple à maintenir. Alternatives
examinées :
- Changer de framework pour un générateur plus léger (Astro, SvelteKit, Zola en Rust) : pages
  plus légères, mais une réécriture complète, et chaque feature de Lyon (ADR 0002) deviendrait
  une réécriture au lieu d'un portage.
- Garder le projet tel quel : aucun coût immédiat, mais le code mort alourdit les pages (par
  exemple Highcharts, ~476 Ko chargés sur chaque page sans aucun graphique affiché) et gêne la
  lecture du code.

## Décision

1. Rester sur Nuxt, pour que les portages depuis Lyon restent des portages.
2. Simplifier par élagage et par un outillage aligné sur Lyon, en petites PR successives :
   - supprimer le code mort hérité de Lyon (Highcharts, dayjs, code des compteurs) ;
   - extraire la logique métier en TypeScript pur et testé, avec un schéma unique des données ;
   - outillage de Lyon : ESLint 9 (`@nuxt/eslint`), formatage, typecheck en CI ;
   - tests dans un navigateur (Playwright), repris de Lyon ;
   - documentation (README, docs/ selon Diátaxis, guide pour les contributeurs de contenu).
3. Une dépendance supprimée pourra revenir quand une feature en aura besoin. Elle sera alors
   chargée seulement sur les pages qui l'utilisent. Exemple : les graphiques des futurs
   compteurs de Montpellier.

## Conséquences

- Pages plus légères et code plus lisible, sans réécriture.
- Le projet garde la complexité propre à Nuxt (conventions, auto-imports, montées de version
  majeures à suivre).
- Le code supprimé reste dans l'historique git et chez Lyon : la phase 4 (compteurs) repartira
  du code lyonnais le plus récent, pas de la version supprimée ici.
