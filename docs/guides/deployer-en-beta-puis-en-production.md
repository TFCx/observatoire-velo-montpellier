# Guide : déployer en beta puis en production

Le site existe en trois versions, toutes hébergées par Netlify et déployées par la CI GitHub
(ADR 0004) :

| Version    | Adresse                                                      | Contenu                                    |
| ---------- | ------------------------------------------------------------ | ------------------------------------------ |
| Aperçu     | `https://pr-<n°>--observatoire-velo-montpellier.netlify.app` | Une pull request, déployée automatiquement |
| Beta       | <https://beta--observatoire-velo-montpellier.netlify.app>    | La branche `montpellier/beta`              |
| Production | <https://observatoire.velocite-montpellier.fr>               | La branche `montpellier/prod`              |

Le code avance toujours dans le même sens : `montpellier/main` → beta → production. On ne pousse
jamais directement sur `montpellier/beta` ni `montpellier/prod` : c'est le workflow « Promote » qui
les avance, après avoir tout revérifié.

## Mettre une version en beta

1. Sur GitHub, onglet **Actions** → workflow **Promote** → **Run workflow**.
2. Choisir `beta`, puis **Run workflow**.

Ou, en ligne de commande :

```bash
gh workflow run promote.yml --repo TFCx/observatoire-velo-montpellier -f environment=beta
```

Le workflow vérifie que la promotion est une avance simple (fast-forward) de `montpellier/main`,
relance tous les tests sur ce commit (données, smoke tests, tests navigateur), déploie sur l'adresse
beta, puis avance la branche `montpellier/beta`. Si une étape échoue, rien n'est déployé.

## Vérifier la beta

- Le pied de page affiche la version déployée : `version <commit> · beta · <date>`.
- Parcourir les pages modifiées, en particulier les cartes (avancement, qualité, type, futur réseau).

## Passer la beta en production

Même workflow, en choisissant `prod`. Il ne peut publier que ce qui est déjà sur
`montpellier/beta` : la production ne reçoit que du code vérifié en beta.

```bash
gh workflow run promote.yml --repo TFCx/observatoire-velo-montpellier -f environment=prod
```

En production, la version n'est pas affichée dans le pied de page ; elle se lit dans le code source
de la page :

```bash
curl -s https://observatoire.velocite-montpellier.fr | grep -o '<meta name="observatoire-build"[^>]*>'
```

## En cas de problème en production

1. Revenir au déploiement précédent sur Netlify : tableau de bord du site → **Deploys** → choisir le
   dernier déploiement de production correct → **Publish deploy**. Le site est rétabli en quelques
   secondes.
2. Corriger par une pull request, puis repasser par beta et production. La branche
   `montpellier/prod` n'est pas modifiée à la main.

## Prérequis (une fois)

- Secret `NETLIFY_AUTH_TOKEN` et variable `NETLIFY_SITE_ID` dans les réglages GitHub du dépôt
  (**Settings → Secrets and variables → Actions**).
- Builds automatiques de Netlify arrêtés : c'est la CI qui déploie.
