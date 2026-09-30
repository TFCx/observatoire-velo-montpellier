import type { SectionFeature } from '~/types';

type SectionStatusText = { label: string; class: string; date?: string };

// Forme commune des pastilles d'un tronçon (statut, qualité), pour qu'elles s'alignent dans les tooltips.
const SECTION_PILL_CLASS =
  'inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-full border bg-white px-2 text-xs font-medium text-gray-700';

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

  // Couleur du bord de la pastille de statut, dans l'esprit de celle de qualité (QualityBadge).
  function getSectionStatus(properties: SectionFeature['properties']): SectionStatusText {
    const statusMapping = {
      done: {
        label: 'terminé',
        date: properties.doneAt && getDoneAtText(properties.doneAt),
        class: 'border-color-primary-primary',
      },
      wip: { label: 'en travaux', class: 'border-dashed border-color-primary-primary' },
      planned: { label: 'prévu', class: 'border-gray-400' },
      postponed: { label: 'reporté', date: 'après 2026', class: 'border-color-secondary' },
      variante: { label: 'variante', class: 'border-dashed border-gray-400' },
      'variante-postponed': { label: 'variante reportée', date: 'après 2026', class: 'border-color-secondary' },
      unknown: { label: 'à définir', class: 'border-gray-300' },
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

  return { SECTION_PILL_CLASS, getSectionStatus, getSectionTypeText };
};
