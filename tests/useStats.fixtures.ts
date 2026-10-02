import type { PromiseYear } from '../domain/schema';
import type { Geojson, LaneStatus, LaneType, LineStringFeature, Quality } from '../types';

type SectionFixtureOptions = {
  id?: string;
  line: number | string;
  status: LaneStatus;
  promisedFor?: PromiseYear;
  type: LaneType;
  // Vide comme dans les données, pour les tronçons dont la qualité n'est pas évaluée.
  quality?: Quality | '';
  doneAt?: string;
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

export function buildSection({
  id,
  line,
  status,
  promisedFor,
  type,
  quality,
  doneAt = '',
}: SectionFixtureOptions): LineStringFeature {
  return {
    type: 'Feature' as const,
    properties: {
      id,
      line: String(line),
      name: `Tronçon de test (ligne ${line})`,
      status,
      promisedFor,
      type,
      quality,
      doneAt,
      link: `/veloligne-${line}`,
    },
    geometry: buildSameGeometryForAllSections(),
  };
}

export function buildVoie(...sections: LineStringFeature[]): Geojson {
  return { type: 'FeatureCollection', features: sections };
}
