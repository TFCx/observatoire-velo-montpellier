import { groupBy } from '../helpers/helpers';
import { isLineStringFeature, LaneStatus, LaneType, LaneTypeFamily, Quality, type Feature, type Geojson, type LineStringFeature } from '../types';

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
    const wipFeatures = features.filter(feature => [LaneStatus.Wip, LaneStatus.Tested].includes(feature.properties.status));
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
        class: 'text-velocite-dark-5 font-semibold'
      },
      done: {
        name: 'Réalisés',
        distance: doneDistance - alreadyExistingDistance,
        percent: getPercent(doneDistance) - getPercent(alreadyExistingDistance),
        class: 'text-velocite-yellow-5 font-semibold'
      },
      wip: {
        name: 'En travaux',
        distance: wipDistance,
        percent: getPercent(wipDistance),
        class: 'text-velocite-brown-1 font-semibold'
      },
      planned: {
        name: "Prévus d'ici 2026",
        distance: plannedDistance,
        percent: getPercent(plannedDistance),
        class: 'text-velocite-light-4 font-semibold'
      },
      postponed: {
        name: 'Après 2026',
        distance: postponedDistance,
        percent: getPercent(postponedDistance),
        class: 'text-lvv-pink font-semibold'
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
      [LaneTypeFamily.MixiteMotoriseGood]: "Cohabitation motorisée",
      [LaneTypeFamily.MixiteMotoriseBad]: "Intrication motorisée",
      [LaneTypeFamily.MixitePietonneGood]: "Cohabitation piétonne",
      [LaneTypeFamily.MixitePietonneBad]: "Intrication piétonne",
      [LaneTypeFamily.Inconnu]: "Inconnu",
}

  function getStatsByTypology(voies: Geojson[]) {
    const lineStringFeatures = getAllUniqLineStrings(voies);
    const totalDistance = getDistance(lineStringFeatures);

    function getPercent(distance: number) {
      return Math.round((distance / totalDistance) * 100);
    }

    const featuresByType = groupBy<LineStringFeature, LaneTypeFamily>(lineStringFeatures, feature => feature.properties.typeFamily);
    return Object.entries(featuresByType)
      .map(([type, features]) => {
        const distance = getDistance(features);
        const percent = getPercent(distance);
        return {
          name: laneTypeFamilyToDescription[type as LaneTypeFamily],
          percent
        };
      })
      .filter(stat => stat.percent > 0) // on ne veut pas afficher les types à 0% (arrondis)
      .sort((a, b) => b.percent - a.percent); // plus grandes barres en haut, plus propre
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

