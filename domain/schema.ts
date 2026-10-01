// Forme des données des Vélolignes (content/voies-cyclables/*.json et en-tête des *.md), décrite une seule fois (ADR 0008).
// Ces schémas décrivent les fichiers tels qu'ils sont saisis, valeurs vides comprises : ils servent à
// les valider (tests/data-health.test.ts) et à en déduire les types TypeScript (types/index.ts).
// Chemins relatifs : ce fichier est aussi chargé par content.config.ts, hors des alias de Nuxt.
import { z } from 'zod';

import { LaneStatus, LaneType, Quality } from '../types';

const coordinatesSchema = z.tuple([z.number(), z.number()]);

// Date de réalisation au format jj/mm/aaaa, ou vide tant que le tronçon n'est pas réalisé.
const DONE_AT_DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;

// Valeur d'une énumération, avec un message qui donne la valeur reçue et les valeurs admises : il est
// lu par les contributeurs quand la CI refuse une saisie.
function enumValue<EnumObject extends Record<string, string>>(enumObject: EnumObject, fieldLabel: string) {
  const allowedValues = Object.values(enumObject).join(', ');
  return z.nativeEnum(enumObject, {
    errorMap: (_issue, context) => ({
      message: `${fieldLabel} "${String(context.data)}" inconnu ; valeurs admises : ${allowedValues}`,
    }),
  });
}

export const lineStringFeatureSchema = z
  .object({
    type: z.literal('Feature'),
    properties: z.object({
      // Un id déclare un tronçon partagé entre plusieurs Vélolignes : même id dans chaque fichier.
      // Un tronçon non partagé n'a pas d'id : null ou "" seraient une deuxième façon de le dire, que la
      // carte et les statistiques ne comprenaient pas pareil (« Vanières Pagnol » absent des statistiques).
      id: z
        .string({
          invalid_type_error: "id attendu sous forme de texte : retirer le champ si le tronçon n'est pas partagé",
        })
        .min(1, "id vide : retirer le champ si le tronçon n'est pas partagé")
        .optional(),
      line: z.string(),
      name: z.string(),
      status: enumValue(LaneStatus, 'statut'),
      type: enumValue(LaneType, "type d'aménagement"),
      // Côté B d'un tronçon dont les deux côtés diffèrent.
      typeB: enumValue(LaneType, "type d'aménagement").optional(),
      // Absente ou vide sur les tronçons dont la qualité n'est pas encore évaluée (souvent prévus).
      quality: enumValue(Quality, 'qualité').or(z.literal('')).optional(),
      qualityB: enumValue(Quality, 'qualité').optional(),
      doneAt: z.string().refine((doneAt) => doneAt === '' || DONE_AT_DATE_PATTERN.test(doneAt), {
        message: 'date de réalisation attendue au format jj/mm/aaaa, ou vide',
      }),
      // Ancre du tronçon dans la page de sa Véloligne, ex. /veloligne-A#avenue-de-la-liberte.
      link: z.string(),
    }),
    geometry: z.object({
      type: z.literal('LineString'),
      coordinates: z.array(coordinatesSchema),
    }),
  })
  .superRefine((feature, context) => {
    if (feature.properties.status === LaneStatus.Done && feature.properties.doneAt === '') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['properties', 'doneAt'],
        message: 'Un tronçon réalisé (status done) doit avoir sa date de réalisation (jj/mm/aaaa)',
      });
    }
    // La qualité d'un tronçon réalisé est affichée sur la carte et dans les tooltips : elle ne peut
    // pas rester à évaluer.
    const { quality } = feature.properties;
    if (feature.properties.status === LaneStatus.Done && (!quality || quality === Quality.Inconnu)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['properties', 'quality'],
        message: 'Un tronçon réalisé (status done) doit avoir sa qualité : good, fair ou bad',
      });
    }
  });

// Photo d'un projet d'aménagement, affichée sur la carte (aucune à Montpellier aujourd'hui).
export const perspectiveFeatureSchema = z.object({
  type: z.literal('Feature'),
  properties: z.object({
    type: z.literal('perspective'),
    line: z.number(),
    name: z.string(),
    imgUrl: z.string(),
  }),
  geometry: z.object({
    type: z.literal('Point'),
    coordinates: coordinatesSchema,
  }),
});

// Un fichier content/voies-cyclables/<véloligne>.json.
export const voieCyclableGeojsonSchema = z.object({
  type: z.literal('FeatureCollection'),
  name: z.string().optional(),
  features: z.array(z.union([lineStringFeatureSchema, perspectiveFeatureSchema])),
});

// En-tête (frontmatter) d'une page content/voies-cyclables/<véloligne>.md. `description` n'y figure pas :
// c'est un champ que Nuxt Content déclare lui-même pour toute page.
export const velolignePageFrontmatterSchema = z.object({
  // YAML lit "line: 1" comme un nombre et "line: A" comme un texte.
  line: z.union([z.number(), z.string()]),
  lineName: z.string(),
  lineNameShort: z.union([z.number(), z.string()]),
  from: z.string(),
  to: z.string(),
  trafic: z.string().nullable().optional(),
  cover: z.string().nullable().optional(),
});
