import { groupBy } from '../helpers/helpers';
import { isLineStringFeature, LaneStatus, LaneType, LaneTypeFamily, Quality, type Feature, type Geojson, type LineStringFeature, type SectionFeature } from '../types';

export type TypologyFamilyStats = {
  name: string;
  percent: number;
  // Exprimés en pourcentage du total et non de la famille : les trois barres de qualité
  // mises bout à bout mesurent exactement `percent`.
  good?: number;
  fair?: number;
  bad?: number;
};

export type TypologyTodoStats = {
  name: string;
  percent: number;
};

export type TypologyStats = {
  doneAndWip: TypologyFamilyStats[];
  todo: TypologyTodoStats;
};

export const useStats = () => {
  function getAllUniqLineStrings(voies: Geojson[]) {
    return voies
      .map(voie => voie.features)
      .flat()
      .filter(isLineStringFeature)
      .filter((feature, index, sections) => {
        if (feature.properties.id === undefined) {
          return true;
        }
        if (feature.properties.id === 'variante2') {
          return false;
        }

        return index === sections.findIndex(section => section.properties.id === feature.properties.id);
      });
  }

  /**
   * retourne la somme des distances de tous les tronçons passé en paramètre.
   * Attention : pas de notion de dédoublonnage ici.
   */
  function getDistance(features: Feature[], checkFeature: (f: Feature) => boolean = () => true): number {
    return features.reduce((acc: number, feature: Feature) => {
      return acc + (checkFeature(feature) ? getLineStringDistance(feature) : 0);
    }, 0);
  }

  function getLineStringDistance(feature: Feature) {
    if (feature.geometry.type !== 'LineString') {
      throw new Error('[getLineStringDistance] Feature must be a LineString');
    }

    let distance = 0;
    const coordinates = feature.geometry.coordinates;

    for (let i = 0; i < coordinates.length - 1; i++) {
      const [lon1, lat1] = coordinates[i];
      const [lon2, lat2] = coordinates[i + 1];
      distance += haversine(lat1, lon1, lat2, lon2);
    }

    return distance;
  }

  function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    // Convert latitude and longitude from degrees to radians
    const toRadians = (angle: number) => (angle * Math.PI) / 180;
    lat1 = toRadians(lat1);
    lon1 = toRadians(lon1);
    lat2 = toRadians(lat2);
    lon2 = toRadians(lon2);

    // Haversine formula
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.asin(Math.sqrt(a));

    // Radius of the Earth in meters
    const radius = 6371000;

    // Calculate the distance in meters
    return Math.round(radius * c);
  }

  function displayDistanceInKm(distance: number, precision = 0) {
    if (distance === 0) {
      return '0 km';
    }
    const distanceInKm = distance / 1000;
    return `${distanceInKm.toFixed(precision)} km`;
  }

  function displayPercent(percent: number) {
    return `${percent}%`;
  }

  /**
   * retourne la somme des distances de tous les tronçons passé en paramètre, aprèds avoir retiré les doublons.
   * un doublon est un tronçon commun entre 2 VLs
   */
  function getTotalDistance(voies: Geojson[]) {
    const features = getAllUniqLineStrings(voies);
    return getDistance(features);
  }

  function getStats(voies: Geojson[]) {
    const features = getAllUniqLineStrings(voies);
    const doneFeatures = features.filter(feature => feature.properties.status === LaneStatus.Done);
    const wipFeatures = features.filter(feature => feature.properties.status === LaneStatus.Wip);
    const plannedFeatures = features.filter(feature =>
      [LaneStatus.Planned, LaneStatus.Unknown, LaneStatus.Variante].includes(feature.properties.status)
    );
    const postponedFeatures = features.filter(feature =>
      [LaneStatus.Postponed, LaneStatus.VariantePostponed].includes(feature.properties.status)
    );

    const totalDistance = getDistance(features);
    const doneDistance = getDistance(doneFeatures);
    const alreadyExistingDistance = getDistance(doneFeatures, f => isBeforeMandat(f));
    const wipDistance = getDistance(wipFeatures);
    const plannedDistance = getDistance(plannedFeatures);
    const postponedDistance = getDistance(postponedFeatures);

    function getPercent(distance: number) {
      return Math.round((distance / totalDistance) * 100);
    }

    return {
      alreadyExisting: {
        name: 'Avant mandat',
        distance: alreadyExistingDistance,
        percent: getPercent(alreadyExistingDistance),
        class: 'text-stats-already-existing font-semibold'
      },
      done: {
        name: 'Réalisés',
        distance: doneDistance - alreadyExistingDistance,
        percent: getPercent(doneDistance) - getPercent(alreadyExistingDistance),
        class: 'text-stats-done font-semibold'
      },
      wip: {
        name: 'En travaux',
        distance: wipDistance,
        percent: getPercent(wipDistance),
        class: 'text-stats-wip font-semibold'
      },
      planned: {
        name: "Prévus d'ici 2026",
        distance: plannedDistance,
        percent: getPercent(plannedDistance),
        class: 'text-stats-planned font-semibold'
      },
      postponed: {
        name: 'Après 2026',
        distance: postponedDistance,
        percent: getPercent(postponedDistance),
        class: 'text-stats-postponed font-semibold'
      }
    };
  }

  const qualityToDescription: { [key in Quality] : string } = {
    [Quality.Bad] : 'Non satisfaisant',
    [Quality.Fair]: 'À améliorer',
    [Quality.Good]: 'Satisfaisant',
  };

  const laneTypeToDescription: { [key in LaneType] : string } = {
      [LaneType.Unidirectionnelle]: "Piste unidirectionnelle",
      [LaneType.Bidirectionnelle]: "Piste bidirectionnelle",
      [LaneType.Bilaterale]: "Piste bilatérale",
      [LaneType.VoieBus]: "Voie bus",
      [LaneType.VoieBusElargie]: "Voie bus élargie",
      [LaneType.Velorue]: "Vélorue",
      [LaneType.VoieVerte]: "Voie verte",
      [LaneType.BandesCyclables]: "Bandes cyclables",
      [LaneType.ZoneDeRencontre]: "Zone de rencontre",
      [LaneType.AirePietonne]: "Aire piétonne",
      [LaneType.Chaucidou]: "Chaucidou",
      [LaneType.Aucun]: "Aucun aménagement",
      [LaneType.Inconnu]: "Inconnu",
  }

  const laneTypeFamilyToDescription: { [key in LaneTypeFamily] : string } = {
      [LaneTypeFamily.Dedie]: "Aménagements cyclables dédiés",
      [LaneTypeFamily.MixiteMotorise]: "En mixité motorisée",
      [LaneTypeFamily.MixitePietonne]: "En mixité piétonne",
      [LaneTypeFamily.Inconnu]: "Inconnu",
}

function computeTypeFamily(type: LaneType): LaneTypeFamily {
  if(type == LaneType.Bidirectionnelle || type == LaneType.Bilaterale || type == LaneType.Unidirectionnelle) {
    return LaneTypeFamily.Dedie
  } else if (type == LaneType.AirePietonne || type == LaneType.VoieVerte) {
    return LaneTypeFamily.MixitePietonne
  } else if (type == LaneType.BandesCyclables || type == LaneType.Chaucidou || type == LaneType.Velorue || type == LaneType.VoieBus || type == LaneType.VoieBusElargie || type == LaneType.ZoneDeRencontre || type == LaneType.Aucun) {
    return LaneTypeFamily.MixiteMotorise
  } else {
    console.assert(type == LaneType.Inconnu)
    //return LaneTypeFamily.Dedie
    return LaneTypeFamily.Inconnu
  }
}

function regroupIntoSections(features: LineStringFeature[]): SectionFeature[] {
  let sections: SectionFeature[] = []
  let sectionsWithDuplicates = []
  for(let f of features) {
    let newSection =
    {
      type: f.type,
      properties:
      {
        id: f.properties.id,
        lines: [f.properties.line],
        name: f.properties.name,
        quality: f.properties.quality,
        qualityB: f.properties.qualityB,
        status: f.properties.status,
        type: f.properties.type,
        typeB: f.properties.typeB,
        typeFamily: computeTypeFamily(f.properties.type),
        typeFamilyB: f.properties.typeB ? computeTypeFamily(f.properties.typeB) : computeTypeFamily(f.properties.type),
        links: [f.properties.link],
        doneAt: f.properties.doneAt,
      },
      geometry: f.geometry
    }
    if(f.properties.id) {
      for(let o of features) {
        if(o != f && f.properties.id == o.properties.id) {
          newSection.properties.lines.push(o.properties.line)
          newSection.properties.links.push(o.properties.link)
        }
      }
    }
    newSection.properties.lines.sort()
    sectionsWithDuplicates.push(newSection)
  }
  let treatedId: string[] = []
  for(let s of sectionsWithDuplicates) {
    if(s.properties.id && treatedId.includes(s.properties.id)) {
      continue
    }
    sections.push(s)
    if(s.properties.id) {
      treatedId.push(s.properties.id)
    }
  }

  for(let s of sections) {
    s.properties.displayedLinesName = s.properties.lines.join('-')
  }

  return sections
}

  function getStatsByTypology(voies: Geojson[]): TypologyStats {
    const lineStringFeatures = getAllUniqLineStrings(voies);

    let sections = regroupIntoSections(lineStringFeatures)


    function getPercent(distance: number, totalDistance: number) {
      return Math.round((distance / totalDistance) * 100);
    }

    // TODO gérer les deux côtés pour les aménagements hétérogènes
    // TODO gérer les quality inconnus ou null ou undefined ?


    let sections_todo = sections.filter(s => s.properties.status == LaneStatus.Planned || s.properties.status == LaneStatus.Postponed)
    let distance_todo = getDistance(sections_todo);

    sections = sections.filter(s => s.properties.status == LaneStatus.Done || s.properties.status == LaneStatus.Wip)
    sections = sections.filter(s => s.properties.typeFamily != LaneTypeFamily.Inconnu)
    const totalDistance = getDistance(sections) + distance_todo;

    // Sans tronçon mesurable (que des variantes, par exemple), totalDistance vaut 0 et la division donnerait NaN.
    let percent_todo = totalDistance > 0 ? (distance_todo / totalDistance) : 0

    const sectionsByType = groupBy<SectionFeature, LaneTypeFamily>(sections, section => section.properties.typeFamily);


    // La famille "inconnu" a déjà été exclue plus haut : il ne reste que dédié et les deux mixités.
    const doneAndWipStats: TypologyFamilyStats[] = Object.entries(sectionsByType)
      .map(([family, sectionsOfFamily]) => {
        const familyDistance = getDistance(sectionsOfFamily);
        const familyPercent = getPercent(familyDistance, totalDistance);
        const familyStats: TypologyFamilyStats = {
          name: laneTypeFamilyToDescription[family as LaneTypeFamily],
          percent: familyPercent
        };

        const sectionsOfFamilyByQuality = groupBy<SectionFeature, Quality>(sectionsOfFamily, section => section.properties.quality);
        for (const [quality, sectionsOfFamilyOfQuality] of Object.entries(sectionsOfFamilyByQuality)) {
          if (quality === Quality.Good || quality === Quality.Fair || quality === Quality.Bad) {
            const qualityPercentOfFamily = getPercent(getDistance(sectionsOfFamilyOfQuality), familyDistance);
            familyStats[quality] = qualityPercentOfFamily * familyPercent / 100;
          }
        }

        return familyStats;
      })
      .filter(familyStats => familyStats.percent > 0) // on ne veut pas afficher les types à 0% (arrondis)
      .sort((a, b) => b.percent - a.percent); // plus grandes barres en haut, plus propre

    return {
      doneAndWip: doneAndWipStats,
      todo: { name: "À réaliser", percent: Math.round(percent_todo * 100) }
    };
  }

  return {
    getAllUniqLineStrings,
    getDistance,
    getTotalDistance,
    getStats,
    getStatsByTypology,
    displayDistanceInKm,
    displayPercent,
    laneTypeToDescription,
    qualityToDescription
  };
};

function isBeforeMandat(feature: Feature): boolean {
  if(!isLineStringFeature(feature)) {
      return false
  }

  let lfeature = feature as LineStringFeature
  let doneAt = lfeature.properties.doneAt

  if(!doneAt) {
    return false
  }

  const [day, month, year] = doneAt.split('/');
  return new Date(Number(year), Number(month) - 1, Number(day)).getTime() < new Date(2021, 0, 1).getTime();
}

