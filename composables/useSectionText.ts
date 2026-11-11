import { getProgressCategory, isDoneAfterPromise } from '../domain/progress';
import type { SectionFeature } from '../types';
import { useStats } from './useStats';

type SectionStatusText = { label: string; class: string; date?: string };

// Forme des pastilles de qualité d'un tronçon (QualityBadge).
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

  function getDoneText(properties: SectionFeature['properties']): string | undefined {
    if (!properties.doneAt) {
      return undefined;
    }
    const doneAtText = getDoneAtText(properties.doneAt);
    return isDoneAfterPromise(properties) ? `${doneAtText}, avec retard` : doneAtText;
  }

  // Libellés de l'ADR 0009. Après l'échéance (janvier 2027), « promis pour fin 2026 » deviendra
  // « promis pour 2026, non réalisé » (TODO.md).
  function getSectionStatus(properties: SectionFeature['properties']): SectionStatusText {
    const statusMapping = {
      done: { label: 'réalisé', date: getDoneText(properties), class: 'text-gray-900' },
      wip: { label: 'en travaux', class: 'text-color-primary-primary' },
      'promised-todo': { label: 'promis', date: `pour fin ${properties.promisedFor}`, class: 'text-gray-400' },
      'unpromised-todo': { label: 'sans échéance', class: 'text-color-secondary' },
      unknown: { label: 'à définir', class: 'text-gray-400' },
    };
    return statusMapping[getProgressCategory(properties)];
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
