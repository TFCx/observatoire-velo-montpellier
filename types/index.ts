import type { z } from 'zod';

import type { lineStringFeatureSchema, perspectiveFeatureSchema, PromiseYear } from '../domain/schema';

export enum LaneType {
  Unidirectionnelle = 'unidirectionnelle',
  Bidirectionnelle = 'bidirectionnelle',
  Bilaterale = 'bilaterale',
  VoieBus = 'voie-bus',
  VoieBusElargie = 'voie-bus-elargie',
  Velorue = 'velorue',
  VoieVerte = 'voie-verte',
  BandesCyclables = 'bandes-cyclables',
  ZoneDeRencontre = 'zone-de-rencontre',
  AirePietonne = 'aire-pietonne',
  Chaucidou = 'chaucidou',
  Aucun = 'aucun',
  Inconnu = 'inconnu',
}

export enum LaneTypeFamily {
  Dedie = 'dédié',
  MixiteMotorise = 'mixité-motorisés',
  MixitePietonne = 'mixité-piétons',
  Inconnu = 'inconnu',
}

// Avancement d'un tronçon. La promesse est un champ à part, promisedFor (ADR 0009).
export enum LaneStatus {
  Done = 'done',
  Wip = 'wip',
  Todo = 'todo',
  Unknown = 'unknown',
}

export enum Quality {
  Bad = 'bad',
  Fair = 'fair',
  Good = 'good',
  Inconnu = 'inconnu',
}

export type PolygonFeature = {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: [number, number][];
  };
};

// Données saisies dans content/voies-cyclables : types déduits du schéma qui les valide (ADR 0008).
export type LineStringFeature = z.infer<typeof lineStringFeatureSchema>;

export type SectionFeature = {
  type: 'Feature';
  properties: {
    id?: string;
    lines: string[];
    displayedLinesName: string;
    name: string;
    status: LaneStatus;
    promisedFor?: PromiseYear;
    quality: Quality;
    qualityB?: Quality;
    type: LaneType;
    typeB?: LaneType;
    typeFamily: LaneTypeFamily;
    typeFamilyB: LaneTypeFamily;
    doneAt?: string;
    links: string[];
  };
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
};

// Une voie par Véloligne d'un tronçon partagé, dessinées côte à côte sur la carte : calculée par
// separateSectionsIntoLanes (useMap.ts) à partir des tronçons regroupés.
export type LaneFeature = {
  type: 'Feature';
  properties: Pick<
    SectionFeature['properties'],
    | 'name'
    | 'status'
    | 'promisedFor'
    | 'quality'
    | 'qualityB'
    | 'type'
    | 'typeB'
    | 'typeFamily'
    | 'typeFamilyB'
    | 'doneAt'
  > & {
    line: string;
    color: string;
    lane_index: number;
    nb_lanes: number;
  };
  geometry: SectionFeature['geometry'];
};

export type PerspectiveFeature = z.infer<typeof perspectiveFeatureSchema>;

export type PumpFeature = {
  type: 'Feature';
  properties: {
    type: 'pump';
    name: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
};

export type DangerFeature = {
  type: 'Feature';
  properties: {
    type: 'danger';
    name: string;
    description: string;
    danger: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
};

type PointFeature = PerspectiveFeature | PumpFeature | DangerFeature;

export type Feature = SectionFeature | LineStringFeature | PointFeature | LaneFeature | PolygonFeature;

export type Geojson = {
  type: string;
  features: Feature[];
};

/**
 * type helpers
 */
export function isLineStringFeature(feature: Feature): feature is LineStringFeature {
  return feature.geometry.type === 'LineString';
}

export function isSectionFeature(feature: Feature): feature is SectionFeature {
  return feature.geometry.type === 'LineString';
}

export function isPointFeature(feature: Feature): feature is PointFeature {
  return feature.geometry.type === 'Point';
}

export function isPolygonFeature(feature: Feature): feature is PolygonFeature {
  return feature.geometry.type === 'Polygon';
}

export function isPerspectiveFeature(feature: Feature): feature is PerspectiveFeature {
  return isPointFeature(feature) && feature.properties.type === 'perspective';
}

export function isDangerFeature(feature: Feature): feature is DangerFeature {
  return isPointFeature(feature) && feature.properties.type === 'danger';
}

export function isPumpFeature(feature: Feature): feature is PumpFeature {
  return isPointFeature(feature) && feature.properties.type === 'pump';
}
