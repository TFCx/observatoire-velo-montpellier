import type { Quality, SectionFeature } from '~/types';

type SectionStatusText = { label: string; class: string; date?: string };

// Textes d'un tronçon partagés par ses tooltips (clic et survol), pour qu'ils disent la même chose.
export const useSectionText = () => {
  const { laneTypeToDescription } = useStats();

  function getDoneAtText(doneAt: string): string {
    const [day, month, year] = doneAt.split('/');
    const isBeforeMandat =
      new Date(Number(year), Number(month) - 1, Number(day)).getTime() < new Date(2021, 0, 1).getTime();
    if (isBeforeMandat) {
      return 'avant 2021';
    }
    return `le ${doneAt}`;
  }

  function getSectionStatus(properties: SectionFeature['properties']): SectionStatusText {
    const statusMapping = {
      done: {
        label: 'terminé',
        date: properties.doneAt && getDoneAtText(properties.doneAt),
        class: 'text-white bg-color-primary-primary rounded-xl px-2 w-fit',
      },
      wip: {
        label: 'en travaux',
        class: 'text-color-primary-primary rounded-xl px-2 border border-dashed border-color-primary-primary',
      },
      planned: {
        label: 'prévu',
        class: 'text-color-primary-primary rounded-xl px-2 border border-color-primary-primary',
      },
      postponed: {
        label: 'reporté',
        date: 'après 2026',
        class: 'text-white bg-color-secondary rounded-xl px-2',
      },
      variante: {
        label: 'variante',
        class: '',
      },
      'variante-postponed': {
        label: 'variante reportée',
        date: 'après 2026',
        class: 'text-white bg-color-secondary rounded-xl px-2',
      },
      unknown: {
        label: 'à définir',
        class: 'text-gray-900 bg-gray-200 rounded-xl px-2',
      },
    };
    return statusMapping[properties.status];
  }

  // Un tronçon dont les deux côtés diffèrent est décrit « côté A & côté B ».
  function getSectionTypeText(section: SectionFeature): string {
    const isHeterogenous = section.properties.typeB != undefined && section.properties.type != section.properties.typeB;
    const typeA = laneTypeToDescription[section.properties.type];
    const typeB = section.properties.typeB ? laneTypeToDescription[section.properties.typeB] : '';
    return isHeterogenous ? `${typeA} & ${typeB}` : typeA;
  }

  // Une qualité par côté quand les deux côtés du tronçon diffèrent.
  function getSectionQualities(section: SectionFeature): Quality[] {
    const { quality, qualityB } = section.properties;
    return qualityB !== undefined && qualityB !== quality ? [quality, qualityB] : [quality];
  }

  return { getSectionStatus, getSectionTypeText, getSectionQualities };
};
