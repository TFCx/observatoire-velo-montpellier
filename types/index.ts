export type LaneType =
| 'bidirectionnelle'
| 'bilaterale'
| 'voie-bus'
| 'velorue'
| 'zone-de-rencontre'
| 'voie-verte'
| 'bandes-cyclables'
| 'trottoirs-cyclables'
| 'aire-pietonne'
| 'chaucidou'
| 'heterogene'
| 'aucun'
| 'inconnu';

export type LaneStatus = 'done' | 'done?' | 'wip' | 'planned-2026' | 'planned-later' | 'postponed-later' | 'hasted-2026' | 'unknown';

export type Quality = 'bad' | 'fair' | 'good';

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
    status: LaneStatus;
    quality: Quality;
    type: LaneType;
    doneAt?: string;
    link?: string;
  };
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
};

export type DisplayedLane = LineStringFeature & { properties: { color: string, lane_index: number, nb_lanes: number } };

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
    type: 'compteur-velo' | 'compteur-voiture',
    line: number;
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
type PointFeature = PerspectiveFeature | CompteurFeature;

export type Feature = LineStringFeature | PointFeature | DisplayedLane | PolygonFeature;

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

export function isPointFeature(feature: Feature): feature is PointFeature {
  return feature.geometry.type === 'Point';
}

export function isPolygonFeature(feature: Feature): feature is PolygonFeature {
  return feature.geometry.type === 'Polygon';
}

export function isPerspectiveFeature(feature: Feature): feature is PerspectiveFeature {
  return isPointFeature(feature) && feature.properties.type === 'perspective';
}

export function isCompteurFeature(feature: Feature): feature is CompteurFeature {
  return isPointFeature(feature) && ['compteur-velo', 'compteur-voiture'].includes(feature.properties.type);
}

