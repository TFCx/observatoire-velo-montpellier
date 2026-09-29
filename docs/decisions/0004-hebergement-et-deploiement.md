# 4. Hébergement et déploiement : Netlify, construit et testé par la CI

Date : 2026-09-28
Statut : Accepté

## Contexte

Le site est entièrement statique (`nuxt generate`). Il est hébergé sur un site Netlify unique
qui construisait lui-même trois branches : `montpellier/test`, `montpellier/beta` et
`montpellier/prod`. Le domaine `observatoire.velocite-montpellier.fr` (CNAME vers Netlify,
certificat Let's Encrypt) est le domaine principal ; `public/_redirects` y renvoie l'adresse
`.netlify.app`.

Deux problèmes :

- Netlify construisait chaque branche indépendamment de la CI GitHub : un commit en échec aux
  tests pouvait être déployé, y compris en production, qui ne doit jamais régresser.
- Chaque build Netlify consomme des minutes de build, d'autant plus avec des aperçus par PR.

Alternatives examinées :

- Laisser Netlify construire, avec des deploy previews : simple, mais consomme des minutes à
  chaque push de PR, et ce qui est déployé n'est pas le build qui a été testé.
- Cloudflare Pages : gratuit, rapide, previews, `_redirects` compatible ; mais migration du DNS
  et de la configuration sans gain nécessaire aujourd'hui.
- GitHub Pages : sans aperçus par PR ni redirection par hôte.
- Serveur Docker/nginx (choix de Lyon) : un serveur à maintenir, contraire à l'objectif de légèreté.

## Décision

1. Rester sur Netlify comme simple hébergeur : les builds Netlify sont arrêtés.
2. La CI GitHub (gratuite pour un dépôt public) construit le site, le teste, puis envoie **ce
   même build** à Netlify avec `netlify deploy --no-build` :
   - pour chaque PR venant du dépôt : un aperçu sur
     `https://deploy-preview-<n°>--observatoire-velo-montpellier.netlify.app`, dont le lien est
     commenté dans la PR (pas d'aperçu pour dependabot ni pour les forks, qui n'ont pas accès
     aux secrets) ;
   - sur demande (workflow « Promote », lancé à la main) : `beta` reçoit `montpellier/main`,
     `prod` ne reçoit que ce qui est sur `montpellier/beta`. La promotion refuse tout ce qui
     n'est pas un fast-forward, reconstruit et reteste le commit, déploie, puis avance la branche.
3. Les branches `montpellier/beta` et `montpellier/prod` ne déclenchent plus rien : elles
   indiquent ce qui est déployé. L'environnement `test` est abandonné, remplacé par les aperçus
   de PR.
4. Secrets nécessaires dans GitHub : `NETLIFY_AUTH_TOKEN` (secret) et `NETLIFY_SITE_ID`
   (variable), créés par le mainteneur.

## Conséquences

- Aucune minute de build Netlify consommée.
- Ce qui est servi est exactement ce qui a passé les tests ; prod ne contient que du code validé
  sur beta.
- Plus de manipulation git manuelle pour déployer : un bouton dans l'onglet Actions.
- Les contributeurs de contenu doivent être collaborateurs du dépôt pour avoir un aperçu de leur
  PR (une PR depuis un fork n'a pas accès aux secrets).
- Dépendance à `netlify-cli`, utilisé uniquement dans la CI (version épinglée dans les workflows).
- Le site étant 100 % statique, changer d'hébergeur reste simple : seule l'étape d'envoi change.

## Erratum (2026-09-28)

Les alias `deploy-preview-<n°>` et `montpellier-beta` entrent en collision avec les déploiements
natifs de Netlify du même nom, qui gardent la priorité : l'adresse de beta servait encore l'ancien
déploiement de branche. Les alias utilisés sont `pr-<n°>`
(`https://pr-<n°>--observatoire-velo-montpellier.netlify.app`) et `beta`
(`https://beta--observatoire-velo-montpellier.netlify.app`). La décision elle-même est inchangée.
