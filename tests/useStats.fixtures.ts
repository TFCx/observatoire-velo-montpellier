import { LaneStatus, LaneType, Quality } from '../types';

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
      [3.8770, 43.6110],
      [3.8780, 43.6115],
      [3.8790, 43.6120]
    ]
  };
}

export function buildSection({ id, line, status, type, quality }: SectionFixtureOptions) {
  return {
    type: 'Feature' as const,
    properties: {
      id,
      line,
      name: `Tronçon de test (ligne ${line})`,
      status,
      type,
      quality,
      link: `/veloligne-${line}`
    },
    geometry: buildSameGeometryForAllSections()
  };
}

export function buildVoie(...sections: ReturnType<typeof buildSection>[]) {
  return { type: 'FeatureCollection' as const, features: sections };
}
