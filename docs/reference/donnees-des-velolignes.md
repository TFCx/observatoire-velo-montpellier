# Référence : données des Vélolignes

Chaque Véloligne est décrite par deux fichiers dans `content/voies-cyclables/` :

- `<véloligne>.json` : les tronçons, avec leur tracé et leur état (lus par la carte et les statistiques) ;
- `<véloligne>.md` : la page de la Véloligne (présentation et texte détaillé de chaque tronçon).

La forme des tronçons est définie par le schéma `domain/schema.ts` (ADR 0008) : la CI refuse toute
modification qui ne le respecte pas, avec un message qui indique le fichier, le tronçon et le champ.

## Tronçon (`<véloligne>.json`)

Le fichier est une `FeatureCollection` GeoJSON. Chaque tronçon est une `Feature` de géométrie
`LineString` ; ses informations sont dans `properties` :

```json
{
  "name": "Passerelle Moulin l'Eveque",
  "line": "2",
  "status": "done",
  "doneAt": "31/12/2019",
  "type": "voie-verte",
  "quality": "bad",
  "link": "/veloligne-2#lez-vieille-poste"
}
```

| Champ      | Obligatoire | Valeurs                                                                                    |
| ---------- | ----------- | ------------------------------------------------------------------------------------------ |
| `name`     | oui         | Nom du tronçon, tel qu'il s'affiche au clic sur la carte.                                  |
| `line`     | oui         | Véloligne, en texte : `"1"`, `"A"`, `"Anneau"`…                                            |
| `status`   | oui         | Avancement : voir [Statuts](#statuts).                                                     |
| `doneAt`   | oui         | Date de réalisation `jj/mm/aaaa` ; vide (`""`) tant que le tronçon n'est pas réalisé.      |
| `type`     | oui         | Type d'aménagement : voir [Types d'aménagement](#types-daménagement).                      |
| `typeB`    | non         | Type de l'autre côté de la chaussée, quand les deux côtés diffèrent.                       |
| `quality`  | non         | Qualité : `good`, `fair`, `bad` ; absente ou vide (`""`) si elle n'est pas encore évaluée. |
| `qualityB` | non         | Qualité de l'autre côté, quand les deux côtés diffèrent.                                   |
| `link`     | oui         | Lien vers le texte du tronçon dans la page : `/veloligne-2#lez-vieille-poste`.             |
| `id`       | non         | Uniquement pour un tronçon partagé entre plusieurs Vélolignes : voir ci-dessous.           |

Règles vérifiées en plus par la CI (`tests/data-health.test.ts`) :

- un tronçon réalisé (`status: "done"`) a une date `doneAt` ;
- `link` mène à un titre existant de la page ;
- un tronçon partagé entre plusieurs Vélolignes porte le **même `id`** dans le fichier de chacune
  d'elles : un `id` présent une seule fois est refusé ;
- le couple `name` + `line` est unique.

### Statuts

| Valeur               | Affiché comme (clic sur la carte) |
| -------------------- | --------------------------------- |
| `done`               | terminé                           |
| `wip`                | en travaux                        |
| `planned`            | prévu                             |
| `postponed`          | reporté                           |
| `variante`           | variante                          |
| `variante-postponed` | variante reportée                 |
| `unknown`            | inconnu                           |

Aucune Véloligne n'utilise aujourd'hui `variante`, `variante-postponed` ni `unknown`.

### Types d'aménagement

| Valeur              | Affiché comme           | Famille                       |
| ------------------- | ----------------------- | ----------------------------- |
| `unidirectionnelle` | Piste unidirectionnelle | Aménagements cyclables dédiés |
| `bidirectionnelle`  | Piste bidirectionnelle  | Aménagements cyclables dédiés |
| `bilaterale`        | Piste bilatérale        | Aménagements cyclables dédiés |
| `voie-verte`        | Voie verte              | En mixité piétonne            |
| `aire-pietonne`     | Aire piétonne           | En mixité piétonne            |
| `bandes-cyclables`  | Bandes cyclables        | En mixité motorisée           |
| `chaucidou`         | Chaucidou               | En mixité motorisée           |
| `velorue`           | Vélorue                 | En mixité motorisée           |
| `voie-bus`          | Voie bus                | En mixité motorisée           |
| `voie-bus-elargie`  | Voie bus élargie        | En mixité motorisée           |
| `zone-de-rencontre` | Zone de rencontre       | En mixité motorisée           |
| `aucun`             | Aucun aménagement       | En mixité motorisée           |
| `inconnu`           | Inconnu                 | Inconnu                       |

## Page de la Véloligne (`<véloligne>.md`)

L'en-tête (frontmatter) :

```yaml
---
line: 2
lineName: Véloligne 2
lineNameShort: 2
description: Véloligne devant offrir (à terme) une jonction directe Montpellier ⇄ Mauguio via Grammont.
trafic:
cover: /VL2_couverture.jpg
from: Mtp Antigone
to: Mauguio
---
```

| Champ           | Obligatoire | Rôle                                                                                            |
| --------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| `line`          | oui         | Numéro ou nom de la Véloligne ; donne l'adresse de la page (`/veloligne-2`).                    |
| `lineName`      | oui         | Nom affiché.                                                                                    |
| `lineNameShort` | oui         | Nom court (pastille de couleur).                                                                |
| `description`   | non         | Phrase de présentation, reprise dans les résultats des moteurs de recherche.                    |
| `from`, `to`    | oui         | Extrémités de la Véloligne.                                                                     |
| `cover`         | non         | Image de couverture : un fichier de `public/` (`/nom.jpg`), jamais une image hébergée ailleurs. |
| `trafic`        | non         | Fréquentation estimée.                                                                          |

Chaque tronçon a un titre `###` : c'est l'ancre visée par le `link` des tronçons du `.json`
(`### Lez ⇄ Vieille Poste` → `#lez-vieille-poste`).

La qualité s'écrit en couleur au début du texte du tronçon, par exemple
`<span style="color:gold;font-weight:bold">À améliorer</span>` (vert : satisfaisant, or : à
améliorer, rouge : non satisfaisant ou dangereux).

## Composants utilisables dans le texte

| Composant                                                                    | Rôle                                                                                                                                                |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `::banner{type="unsecured"}` … `::`                                          | Encadré. Types : `unsecured` (non sécurisé), `wip` (travaux en cours), `postponed` (reporté), `modified` (modification après concertation), `info`. |
| `:line-link{line=B}`                                                         | Pastille-lien vers une autre Véloligne.                                                                                                             |
| `:line-link{line=B anchor=avenue-einstein}`                                  | Même chose, vers un tronçon précis de cette Véloligne.                                                                                              |
| `::content-image` avec `imageUrl`, `caption`, `credit`, `streetView`, `link` | Image légendée ; `imageUrl` est un fichier de `public/`. `streetView` : paramètres Google Street View (`lat,lon,3a,…`).                             |
| `:transport-link{type=tram line=1}`                                          | Pastille d'une ligne de tram, avec lien vers sa page TaM ; lignes déclarées dans `config.json` (`transports`).                                      |

Exemple d'image :

```mdc
::content-image
---
imageUrl: /VL2_compteur.jpg
caption: Présence d'un compteur muni d'un totem d'affichage à l'est de la passerelle.
credit: Vélocité
---
::
```

Les images vont dans `public/`, sous un nom explicite (`VL2_compteur.jpg`) : la CI refuse une image
hébergée sur un autre site, qui peut disparaître sans prévenir.
