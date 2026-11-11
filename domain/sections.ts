// Regroupement des tronçons saisis (un par Véloligne) en tronçons affichés et comptés : un tronçon
// partagé entre plusieurs Vélolignes (même id dans chaque fichier) devient un seul tronçon qui les
// liste toutes. Utilisé par la carte (components/Map.vue) et les statistiques (useStats).
import { LaneStatus, LaneType, LaneTypeFamily, Quality, type LineStringFeature, type SectionFeature } from '../types';

export function computeTypeFamily(type: LaneType): LaneTypeFamily {
  if (type == LaneType.Bidirectionnelle || type == LaneType.Bilaterale || type == LaneType.Unidirectionnelle) {
    return LaneTypeFamily.Dedie;
  } else if (type == LaneType.AirePietonne || type == LaneType.VoieVerte) {
    return LaneTypeFamily.MixitePietonne;
  } else if (
    type == LaneType.BandesCyclables ||
    type == LaneType.Chaucidou ||
    type == LaneType.Velorue ||
    type == LaneType.VoieBus ||
    type == LaneType.VoieBusElargie ||
    type == LaneType.ZoneDeRencontre ||
    type == LaneType.Aucun
  ) {
    return LaneTypeFamily.MixiteMotorise;
  } else {
    console.assert(type == LaneType.Inconnu);
    return LaneTypeFamily.Inconnu;
  }
}

export function regroupIntoSections(features: LineStringFeature[]): SectionFeature[] {
  const sections: SectionFeature[] = [];
  const sectionsWithDuplicates = [];
  for (const f of features) {
    const newSection: SectionFeature = {
      type: 'Feature',
      properties: {
        id: f.properties.id,
        lines: [f.properties.line],
        name: f.properties.name,
        // Qualité non évaluée (absente ou vide dans les données) : même affichage que « inconnu ».
        quality: f.properties.quality || Quality.Inconnu,
        qualityB: f.properties.qualityB,
        status: f.properties.status,
        promisedFor: f.properties.promisedFor,
        type: f.properties.type,
        typeB: f.properties.typeB,
        typeFamily: computeTypeFamily(f.properties.type),
        typeFamilyB: f.properties.typeB ? computeTypeFamily(f.properties.typeB) : computeTypeFamily(f.properties.type),
        doneAt: f.properties.doneAt,
        // Tronçon sans lien propre : le tooltip renvoie alors vers la page de la Véloligne.
        links: f.properties.link ? [f.properties.link] : [],
        displayedLinesName: '',
      },
      geometry: f.geometry,
    };
    if (f.properties.id) {
      for (const o of features) {
        if (o != f && f.properties.id == o.properties.id) {
          newSection.properties.lines.push(o.properties.line);
          if (o.properties.link) {
            newSection.properties.links.push(o.properties.link);
          }
        }
      }
    }
    newSection.properties.lines.sort();
    sectionsWithDuplicates.push(newSection);
  }
  const treatedId: string[] = [];
  for (const s of sectionsWithDuplicates) {
    if (s.properties.id && treatedId.includes(s.properties.id)) {
      continue;
    }
    sections.push(s);
    if (s.properties.id) {
      treatedId.push(s.properties.id);
    }
  }

  for (const s of sections) {
    s.properties.displayedLinesName = '(' + s.properties.lines.join(',') + ')';
  }

  return sections;
}

// Qualités affichées pour un tronçon : aucune tant qu'il n'est pas terminé (sa qualité n'est pas
// encore évaluée), une par sens de circulation quand les deux sens diffèrent.
export function getDisplayedQualities(section: SectionFeature): Quality[] {
  const { status, quality, qualityB } = section.properties;
  if (status !== LaneStatus.Done) {
    return [];
  }
  return qualityB !== undefined && qualityB !== quality ? [quality, qualityB] : [quality];
}
