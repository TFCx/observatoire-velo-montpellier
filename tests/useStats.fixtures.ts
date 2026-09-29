import type { Geojson, LaneStatus, LaneType, LineStringFeature, Quality } from '../types';

type SectionFixtureOptions = {
  id?: string;
  line: number | string;
  status: LaneStatus;
  type: LaneType;
  quality?: Quality;
};

// Tous les tronçons de test partagent la même géométrie, donc la même longueur :
// les pourcentages attendus se lisent directement (1 sur 2 = 50 %, 1 sur 3 = 33 %).
function buildSameGeometryForAllSections() {
  return {
    type: 'LineString' as const,
    coordinates: [
      [3.877, 43.611],
      [3.878, 43.6115],
      [3.879, 43.612],
    ] as [number, number][],
  };
}

// Comme dans les GeoJSON réels, line peut être un nombre et quality manquer (tronçons prévus), ce que
// LineStringFeature ne décrit pas encore : d'où les conversions (schéma unique des données à venir,
// plan de simplification).
export function buildSection({ id, line, status, type, quality }: SectionFixtureOptions): LineStringFeature {
  return {
    type: 'Feature' as const,
    properties: {
      id,
      line: line as string,
      name: `Tronçon de test (ligne ${line})`,
      status,
      type,
      quality: quality as Quality,
      link: `/veloligne-${line}`,
    },
    geometry: buildSameGeometryForAllSections(),
  };
}

export function buildVoie(...sections: LineStringFeature[]): Geojson {
  return { type: 'FeatureCollection', features: sections };
}
