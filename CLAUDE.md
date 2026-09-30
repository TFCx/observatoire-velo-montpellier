# Observatoire du plan vélo de Montpellier

Site statique de Vélocité Grand Montpellier : avancement, type et qualité des Vélolignes.
Fork de Cyclopolis (Lyon), dont on porte les features à la main (ADR 0002).
Un seul mainteneur (Jean-David) ; un ou deux contributeurs de contenu (.md, .json).

Pour aller plus loin : `docs/explications/architecture.md`, `docs/reference/donnees-des-velolignes.md`,
les ADR dans `docs/decisions/`, et `TODO.md` (feuille de route).

## Stack

- Nuxt 4 avec la structure à la racine (`srcDir: '.'`, ADR 0003), Nuxt Content v3, MapLibre 6, Tailwind.
- Données : `content/voies-cyclables/*.json` (GeoJSON) et `*.md` (une page par Véloligne).
- Logique métier en TypeScript pur dans `domain/` ; schéma zod unique des données dans `domain/schema.ts`
  (ADR 0008). Content v3 ne valide pas les données : c'est `tests/data-health.test.ts` qui le fait.
- Node 24 (`.nvmrc`).

## Commandes

- `npm test -- --run` : tests unitaires et de données.
- `npm run test:smoke` : génère le site, puis vérifie les pages générées.
- `npm run test:e2e` : génère le site, puis tests dans Chromium (ADR 0006).
- `npm run format:check`, `npm run lint`, `npm run typecheck` : exécutés en CI, bloquants.
- Contrôler chaque commande par son **code de retour** (`; echo exit=$?`), jamais par `| tail` :
  oxfmt affiche ses erreurs avant une dernière ligne qui a l'air normale.

## Git et PR

- Remotes : `origin` (TFCx/observatoire-velo-montpellier) et `lyon` (Cyclopolis). Branche de base :
  `montpellier/main`, qui est aussi le nom de la branche locale.
- `gh` : toujours `--repo TFCx/observatoire-velo-montpellier`. `gh pr edit` échoue (Projects classic) :
  passer par `gh api -X PATCH repos/TFCx/observatoire-velo-montpellier/pulls/<n> -F body=@fichier.md`.
- Merge : `gh pr merge <n> --merge --subject "Merge #<n> : <titre>"`, jamais de squash ; puis mettre à jour
  `montpellier/main` en local et supprimer la branche.
- Le force-push est bloqué pour Claude : quand un historique de PR doit être réécrit, préparer les commits
  et donner la commande exacte à Jean-David.
- `git add` : jamais de chemin qui peut ne plus exister dans la même commande (un échec laisse l'index
  partiel) ; vérifier `git status --short` avant chaque commit.

## Déploiement (ADR 0004, `docs/guides/deployer-en-beta-puis-en-production.md`)

- La CI construit, teste et déploie ; Netlify ne construit rien. Aperçu de chaque PR :
  `https://pr-<n>--observatoire-velo-montpellier.netlify.app`.
- beta et prod ne changent que par le workflow Promote. **Jamais de push direct** sur `montpellier/beta`
  ou `montpellier/prod`.
- Claude peut lancer la promotion, mais **demande confirmation juste avant, à chaque fois**, en donnant
  l'environnement et les commits avant/après, flèche dans le sens du flux : « main → beta : `montpellier/beta`
  passe de `abc1234` à `def5678` ». Vérifier ensuite la balise `observatoire-build` de l'environnement.
- Pas de promotion pour de simples montées de dépendances : les promotions accompagnent des features.
- La prod est le site public de l'association : elle ne doit jamais régresser. Jean-David vérifie sur beta.

## Pièges connus

- Nuxt nomme les composants d'après leur dossier (`components/tooltips/QualityBadge.vue` devient
  `TooltipsQualityBadge`) : importer explicitement les composants d'un sous-dossier.
- Icônes `@nuxt/icon` utilisées dans des composants montés à la main (tooltips) : les lister dans
  `icon.clientBundle.icons` de `nuxt.config.ts`, sinon elles manquent sur le site généré.
- Ne pas importer `maplibre-gl` depuis un fichier utilisé hors des pages avec carte (bundle).
- Tests navigateur en local : WebGL headless peut échouer ; `tests/e2e/browser.ts` a un repli.

## Definition of done d'une PR

- Tests : un nouveau test a été vu rouge (bug volontaire si besoin) ; limites du test dites honnêtement.
- `format:check`, `lint`, `typecheck`, unitaires, smoke et e2e verts en local, puis CI verte.
- Changement visible : captures avant/après montrées, sur desktop et, si pertinent, sur mobile.
- Choix structurant : ADR ajouté ou mis à jour (statut, erratum). Doc Diátaxis à jour si le comportement
  ou une procédure change.
- `TODO.md` à jour (tâche cochée, nouvelles idées ou dettes notées).
- Refactor et feature dans des commits séparés.
- Description de PR : pourquoi, ce qui change, ce qui a été vérifié, et ce qui ne l'a pas été.
