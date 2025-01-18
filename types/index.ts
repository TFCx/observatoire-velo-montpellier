export enum LaneTypeE {
  Unidirectionnelle = "unidirectionnelle",
  Bidirectionnelle = "bidirectionnelle",
  Bilaterale = "bilaterale",
  VoieBus = "voie-bus",
  VoieBusElargie = "voie-bus-elargie",
  Velorue = "velorue",
  VoieVerte = "voie-verte",
  BandesCyclables = "bandes-cyclables",
  ZoneDeRencontre = "zone-de-rencontre",
  AirePietonne = "aire-pietonne",
  Chaucidou = "chaucidou",
  Aucun = "aucun",
  Inconnu = "inconnu"
}

export enum LaneTypeFamilyE {
  Dedie = "dédié",
  MixiteMotoriseGood = "mixité-motorisé-good",
  MixiteMotoriseBad = "mixité-motorisé-bad",
  MixitePietonneGood = "mixité-piétonne-good",
  MixitePietonneBad = "mixité-piétonne-bad",
  Inconnu = "inconnu"
}

export enum LaneStatusE {
  Done = "done",
  Wip = "wip",
  Planned = "planned",
  Tested = "tested",
  Postponed = "postponed",
  Unknown = "unknown",
  Variante = "variante",
  VariantePostponed = "variante-postponed",
}

export enum QualityE {
  Bad = "bad",
  Fair = "fair",
  Good = "good"
}


export type PolygonFeature = {
  type: 'Feature';
  geometry: {
    type: "Polygon",
    coordinates: [number, number][];
  }
}

export type LineStringFeature = {
  type: 'Feature';
  properties: {
    id?: string
    line: string;
    name: string;
    status: LaneStatusE;
    quality: QualityE;
    qualityB?: QualityE;
    type: LaneTypeE;
    typeB?: LaneTypeE;
    typeFamily: LaneTypeFamilyE;
    typeFamilyB?: LaneTypeFamilyE;
    doneAt?: string;
    link?: string;
  };
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
};

export type SectionFeature = {
  type: 'Feature';
  properties: {
    lines: string[];
    name: string;
    status: LaneStatusE;
    quality: QualityE;
    qualityB?: QualityE;
    type: LaneTypeE;
    typeB?: LaneTypeE;
    typeFamily: LaneTypeFamilyE;
    typeFamilyB?: LaneTypeFamilyE;
    doneAt?: string;
  };
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
};

export type MultiColoredLineStringFeature = LineStringFeature & { properties: { colors: string[] } };
//export type SectionFeature = LineStringFeature & { properties: { colors: string[] } };
export type LaneFeature = LineStringFeature & { properties: { color: string, lane_index: number, nb_lanes: number } };

export type PerspectiveFeature = {
  type: 'Feature';
  properties: {
    type: 'perspective';
    line: number;
    name: string;
    imgUrl: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
};

export type CompteurFeature = {
  type: 'Feature';
  properties: {
    type: 'compteur-velo' | 'compteur-voiture';
    line?: number;
    name: string;
    link?: string;
    counts: Array<{
      month: string;
      count: number;
    }>;
    /**
     * z-index like
     */
    circleSortKey?: number;
    circleRadius?: number;
    circleStrokeWidth?: number;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
};

export type PumpFeature = {
  type: 'Feature';
  properties: {
    type: 'pump',
    name: string
  }
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export type DangerFeature = {
  type: 'Feature';
  properties: {
    type: 'danger',
    name: string
  }
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

type PointFeature = PerspectiveFeature | CompteurFeature | PumpFeature | DangerFeature;

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

export function isDangerFeature(feature: Feature): feature is PerspectiveFeature {
  return isPointFeature(feature) && feature.properties.type === 'danger';
}

export function isPumpFeature(feature: Feature): feature is PumpFeature {
  return isPointFeature(feature) && feature.properties.type === 'pump';
}

export function isCompteurFeature(feature: Feature): feature is CompteurFeature {
  return isPointFeature(feature) && ['compteur-velo', 'compteur-voiture'].includes(feature.properties.type);
}

