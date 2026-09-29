# Guide : modifier le contenu depuis GitHub

Ce guide s'adresse aux bénévoles qui mettent à jour l'observatoire sans outils de développement :
tout se fait dans le navigateur, sur GitHub. Il faut un compte GitHub **ajouté comme collaborateur du
dépôt** (le demander au mainteneur) : une modification proposée depuis une copie personnelle (fork)
n'a pas d'aperçu.

Les champs et leurs valeurs admises sont décrits dans la
[référence des données](../reference/donnees-des-velolignes.md).

## Modifier un fichier

1. Ouvrir le dépôt : <https://github.com/TFCx/observatoire-velo-montpellier>, puis le dossier
   `content/voies-cyclables/`.
2. Ouvrir le fichier à modifier :
   - `veloligne-3.json` pour l'état d'un tronçon (statut, date, type, qualité) ;
   - `veloligne-3.md` pour le texte de la page.
3. Cliquer sur le crayon (« Edit this file »), en haut à droite du fichier.
4. Faire la modification (exemples ci-dessous).
5. Cliquer sur **« Commit changes… »**, puis :
   - écrire en une ligne ce qui change, par exemple « VL 3 : tronçon Jean Moulin terminé » ;
   - choisir **« Create a new branch for this commit and start a pull request »** ;
   - valider avec **« Propose changes »**, puis **« Create pull request »**.

La modification n'est pas encore en ligne : elle attend d'être vérifiée et relue (étapes suivantes).

## Exemple : un tronçon est terminé

Dans le `.json` de la Véloligne, trouver le tronçon par son `name` (Ctrl+F dans la page), puis
changer son statut et renseigner la date de réalisation :

```json
"status": "done",
"doneAt": "15/06/2026",
```

Un tronçon terminé doit avoir sa date : `doneAt` au format jour/mois/année. Tant qu'il ne l'est pas,
`doneAt` reste vide : `"doneAt": ""`.

## Vérifier sa modification

Une fois la pull request créée, GitHub lance des vérifications automatiques (environ 2 minutes),
visibles en bas de la pull request :

- **coche verte** : tout est correct. Un commentaire donne le lien de l'**aperçu**
  (`https://pr-<numéro>--observatoire-velo-montpellier.netlify.app`) : c'est le site avec la
  modification, à vérifier avant qu'elle soit fusionnée ;
- **croix rouge** : une erreur a été détectée. Cliquer sur **« Details »** à côté de la vérification
  `test`, puis lire le message. Il indique le fichier, le tronçon et le champ en cause, par exemple :

  ```
  veloligne-3.json : ligne 3, tronçon "Jean Moulin" : status : statut "finished" inconnu ;
  valeurs admises : done, wip, planned, postponed, unknown, variante, variante-postponed
  ```

  Pour corriger, rouvrir le fichier depuis l'onglet **« Files changed »** de la pull request
  (menu « … » → « Edit file »), corriger, puis « Commit changes » : les vérifications se relancent.

Erreurs fréquentes :

| Message                                               | Correction                                                                             |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `… inconnu ; valeurs admises : …`                     | Faute de frappe dans une valeur : reprendre une des valeurs admises.                   |
| `date de réalisation attendue au format jj/mm/aaaa`   | Écrire la date comme `15/06/2026`.                                                     |
| `Un tronçon réalisé (status done) doit avoir sa date` | Renseigner `doneAt`.                                                                   |
| `lien "…" sans titre correspondant`                   | Le `link` du tronçon doit viser un titre `###` existant de la page `.md`.              |
| `… externe https://…`                                 | Déposer l'image dans `public/` (voir ci-dessous) au lieu d'un lien vers un autre site. |
| Le fichier ne s'enregistre pas, ou `JSON` invalide    | Virgule ou guillemet manquant : comparer avec les lignes voisines.                     |

## Ajouter une image

1. Ouvrir le dossier `public/`, cliquer sur **« Add file » → « Upload files »**, déposer l'image avec
   un nom explicite (`VL3_jean_moulin.jpg`).
2. Dans le `.md`, l'insérer à l'endroit voulu :

   ```mdc
   ::content-image
   ---
   imageUrl: /VL3_jean_moulin.jpg
   caption: La nouvelle piste avenue Jean Moulin.
   credit: Vélocité
   ---
   ::
   ```

Les images hébergées sur d'autres sites sont refusées : elles peuvent disparaître sans prévenir.

## Modifier le tracé d'un tronçon

Le tracé (`geometry.coordinates`) se dessine avec un outil de carte en ligne comme
<https://geojson.io> : copier la `Feature` du tronçon dans l'outil, ajuster le tracé, puis recopier
les coordonnées dans le fichier. Vérifier ensuite le résultat sur l'aperçu.

## Et ensuite ?

Le mainteneur relit la pull request et la fusionne. La modification est alors dans la version en
préparation ; elle apparaît sur <https://observatoire.velocite-montpellier.fr> à la mise en ligne
suivante (d'abord sur la version beta, puis en production).
