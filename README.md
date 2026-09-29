# Observatoire du plan vélo de Montpellier

Suivi citoyen de l'avancement des Vélolignes, le réseau cyclable de la Métropole de Montpellier,
par l'association [Vélocité Grand Montpellier](https://www.velocite-montpellier.fr) :
<https://observatoire.velocite-montpellier.fr>

- une carte interactive de l'avancement, de la qualité et du type des aménagements ;
- une page par Véloligne, tronçon par tronçon ;
- un tableau de bord et l'évolution année par année.

L'observatoire est construit à partir de [Cyclopolis](https://cyclopolis.fr), l'outil open source de
l'association lyonnaise [La Ville à Vélo](https://lavilleavelo.org). Licence MIT.

## Contribuer au contenu

Mettre à jour un tronçon, le texte d'une Véloligne ou une image se fait depuis GitHub, sans rien
installer : [guide pour modifier le contenu](docs/guides/modifier-le-contenu-depuis-github.md).
Les champs et leurs valeurs sont décrits dans la
[référence des données](docs/reference/donnees-des-velolignes.md).

## Développer

Prérequis : Node 24 (version dans `.nvmrc`, par exemple avec [nvm](https://github.com/nvm-sh/nvm)).

```bash
nvm use
npm ci
npm run dev
```

Le site est servi sur <http://localhost:3000>.

| Commande             | Rôle                                                         |
| -------------------- | ------------------------------------------------------------ |
| `npm run dev`        | Serveur de développement.                                    |
| `npm run generate`   | Génère le site statique dans `.output/public`.               |
| `npm test`           | Tests unitaires et tests des données (`tests/`), en continu. |
| `npm run test:smoke` | Génère le site, puis vérifie les pages produites.            |
| `npm run test:e2e`   | Génère le site, puis vérifie les cartes dans Chromium.       |
| `npm run format`     | Formate le code (`oxfmt`).                                   |
| `npm run lint`       | Vérifie le code (ESLint).                                    |
| `npm run typecheck`  | Vérifie les types (`vue-tsc`).                               |
| `npm run og-image`   | Refait l'image de partage `public/og-image.png`.             |

Pour les tests navigateur, Chromium se télécharge une fois : `npx playwright-core install --only-shell chromium`.

Chaque pull request est vérifiée par la CI (formatage, lint, types, tests) et déployée sur un aperçu
dont le lien est commenté dans la pull request.

## Documentation

- [`docs/guides/`](docs/guides/) : guides pratiques (contribuer au contenu, déployer, porter une
  feature de Cyclopolis, refaire l'image de partage) ;
- [`docs/reference/`](docs/reference/) : référence (données, composants de contenu) ;
- [`docs/explications/`](docs/explications/) : comment et pourquoi l'observatoire est construit ainsi ;
- [`docs/decisions/`](docs/decisions/) : décisions d'architecture (ADR), dont la relation avec
  Cyclopolis (ADR 0002) et l'hébergement (ADR 0004).
