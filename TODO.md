Feuille de route technique (sept. 2026) — voir docs/decisions/0002 :
- Phase 0 : fondations — FAIT (sept. 2026)
  - [x] ADR 0002 (portage manuel des features de Cyclopolis, remplace 0001)
  - [x] CI (run_tests.yml) : tests unitaires, tests de données (data-health), smoke tests sur le site généré
  - [x] Robots lyonnais retirés, dependabot suspendu (limite de PR à 0 : à réactiver en hebdo)
- Phase 1 : montée de stack — FAIT pour les versions (PR #2 à #6)
  - [x] Nuxt 4.5 (structure à la racine, ADR 0003), @nuxt/content 3.16, MapLibre 5.24, @nuxtjs/tailwindcss 6.14
  - [x] Sitemap via @nuxtjs/sitemap sur https://observatoire.velocite-montpellier.fr, redirection .netlify.app (public/_redirects)
  - [x] Merge `-s ours` sur lyon/main pour recaler la base de merge (ADR 0002, décision 3)
  - [x] Schémas de content.config.ts : laissés souples. Constaté (28/09/2026) : Content v3 ne rejette pas une donnée
        non conforme au schéma (build réussi avec un statut invalide) -> tests/data-health.test.ts reste LE garde-fou.
        Plus tard (plan de simplification, étape domain/) : un schéma zod unique pour typer les composants ET valider
        dans les tests. Conventions à respecter : doneAt = "" si non réalisé ; quality = "" ou absente (surtout planned).
  - [x] Dependabot réactivé : npm hebdo (mineures + correctifs groupés, majeures une par une), GitHub Actions mensuel
  - [x] Hébergement : ADR 0004 (Netlify, construit et testé par la CI, aperçus par PR, workflow "Promote")
    - [x] Secrets configurés, builds Netlify arrêtés, branche montpellier/test supprimée
    - [x] Première promotion main → beta → prod (28/09/2026, commit defc9ce)
  - [x] Node 24 (LTS, .nvmrc) — PR #16
  - Un jour : passer à la convention Nuxt 4 `app/`, dans un commit de renommage pur (ADR 0003)
- Défauts relevés pendant la phase 1 :
  - [x] og:url / twitter:url pointent vers velocite-montpellier.fr au lieu de config.siteUrl
  - [x] composables/map/network.ts : la couche de contour des tronçons reportés lit `lines` sur des lanes (qui n'ont que nb_lanes) -> avertissement MapLibre "Expected value to be of type string or array, but found null"
- Phase 2 : features de contenu (portage depuis Lyon)
  - Galeries photo/vidéo
  - Panoramax
  - Chronologie des livraisons
  - Plateforme de publication : collection "analyses / notices d'aménagement" du groupe infra (cf. "Propositions de vélocité")
- Phase 3 : features de carte (réimplémentées dans notre code, dans cet ordre)
  - Fonds de carte au choix + accessibilité (palette contraste élevé, couleurs personnalisées, réduction des animations)
    - À voir dans une branche dédiée : test d'une couleur unique pour toutes les vélolignes (simplifierait l'affichage des lignes parallèles)
  - Tooltip au survol
  - Panneau latéral de tronçon (cf. "Nouveau popup de section")
  - Curseur de dates (cf. "Nouveau widget timeline")
  - Géocodeur
  - Mobile : bottom sheet, menu
  - Plus tard, peu coûteux : page d'impression, export GPX
- Page /services (pompes à vélo) : supprimée car elle affichait les pompes de Lyon. À recréer :
  - Recréer pages/services, la collection "services" (content.config.ts) et content/services/pumps.json (voir l'historique git)
  - Adapter .github/scripts/osm.js à "Montpellier Méditerranée Métropole" (User-Agent obligatoire, Overpass souvent surchargé -> réessais / miroirs)
  - Rafraîchissement -> ADR : script manuel vs robot planifié (hebdo/mensuel, PR ou commit si tests de données verts), garde-fou contre une réponse vide
- Phase 4 : compteurs Montpellier (cf. "Intégration compteurs")
  - Brancher sur les flux open data de la Métropole -> ADR
  - Inspirations : compteurs.velocite-montpellier.fr/dashboard, compteurs-velo-de-montpellier.onrender.com, montpellier-bike.vercel.app
- En continu : refactor de chaque zone avant d'y porter une feature, en commit séparé

Prochaine release :
- [x] [BUG] lien mort dans page anneau (remplacement des images par assets ?) + lien mort véloligne A
  - Vérifié le 29/09/2026 : plus de lien mort sur ces pages ; le vrai lien mort était la couverture de la VL 10.
    Toutes les images des Vélolignes sont désormais dans public/ (test de données : aucune image externe).
- [UX] mettre à jour les légendes :
  - supprimer le bouton 2021 dans la vue "évolution" s'il n'y a pas de trucs en 2021
    (29/09/2026 : aucun tronçon réalisé en 2021, et le bouton est coché par défaut)
- [x] [CONTENT] mettre à jour le post de news : date et contenu (dire ce qui a changé dans l'observatoire avec cette mise à jour)
- [DATA] Vérifier les données :
  - aller vérifier sur le terrain (ou demander à notre puissant réseau) pour la véloligne 8 et les travaux L5 et les trucs entre les travaux L5
  - Vérifier l'avancement
  - Vérifier la qualité
- [REFACTOR] Factoriser le code des displayLayer
- [REFACTOR] Check la console / bugs (et les console.debug)
  - [x] Passe du 29/09/2026 : seul warning à nous (prop options de Map sur /carte-interactive/embed) corrigé ;
        les autres viennent de Nuxt (H3, devtools, Suspense). Restent : vitest 2 → 4 et MapLibre 5 → 6 (npm audit)
- [BUG] carte-interactive/embed.vue et index.vue : l'image de partage est codée en dur sur un fichier au nom haché
  (logoCyclopolisVGM.CzJjkGQi.png) de l'ancienne adresse .netlify.app -> casse si l'image change
- [x] [SEO] /historique, /blog, /mentions-legales, /sites-partenaires, /evolution et les articles de blog gardent le titre générique du site

Moyen terme :
- [UX] Dans Type & Qualité : couleurs des familles
- [REFACTOR] Faire en sorte que le nom de la section ne soit pas une clé primaire pour les sections partagées
- [REFACTOR] MAJ les auto-scripts qui envoient des mails
- [REFACTOR] Regrouper les fonctions "regroupIntoSections"
- [REFACTOR] Pouvoir tester que les descriptions des multilignes sont factorisées sur chaque ligne ou au moins identiques ?
- [FEAT] Ajouter layer "historique / évolution"
  - [UX] Ajuster les couleurs y compris dans les bars de progression
- [FEAT] Déplacer le lien vers le "tableau de bord"
- [FEAT] Voir si dessiner les layers qualités/type avec le status ? Voir interactions avec les PCs non REV
- [CONTENT] Renseigner un peu plus en détail Vélolignes C et D  (.md)
- [FEAT++]mettre des liens vers le site des compteurs, Vigilo, Ville.plus, le baromètre.. peut-être en bas en pied de page ?
- résoudre le bug de :line-link{line=X}
- [FEAT++] Intégrer les carrefours
- [FEAT++]"Propositions de vélocité" (ex: une catégorie "petits tronçons à faire en priorité")
- [FEAT++] Ajout "envoyer une remarque" sur un tronçon. Comment le gérer ? Mail ?
- [FEAT++] Autres lignes majeures (BT, T, VL70, ...)
- [FEAT] Statut "tactically-done" pour les aménagements transitoires / urbanisme tactique (ex : VL C Fabrègues-Saussan). L'ancien statut lyonnais "tested" a été supprimé car inutilisé.
- Avoir des groupes (vélolignes, majeures, connexions... ) ?
- Nouveau widget timeline
- Nouveau popup de section
- Changer la limite avec un greyout hors du polygone
- Autres infos vélo (rue écoles, 30kmh, parking, ...)
- Lib : pinia a l'air cool (utilisé par Marseille)
- Améliorer l'identité graphique
- MAJ baromètre

Long terme :
- Intégration topographie
- Aménagement sur 2 sens (éviter hétérogène)
- Visu à 2 lanes pour la qualité quelque soit le réseau
- Intégration compteurs
- Intégration Vigilo
- Intégration Baromètre des villes cyclables
