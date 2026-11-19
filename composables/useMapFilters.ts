import { ProgressCategory } from '~/domain/progress';
import { LaneType } from '~/types';

export type StatusFilter = { label: string; isEnabled: boolean; progressCategories: ProgressCategory[] };
export type TypeFilter = { label: string; isEnabled: boolean; types: LaneType[] };

// État des filtres d'une carte, partagé par la modale et le panneau latéral (ADR 0010) : passer de
// l'un à l'autre (redimensionnement de la fenêtre) ne doit pas réinitialiser les filtres.
export function useMapFilters() {
  const statusFilters = ref<StatusFilter[]>([
    { label: 'Réalisé', isEnabled: true, progressCategories: [ProgressCategory.Done] },
    { label: 'En travaux', isEnabled: true, progressCategories: [ProgressCategory.Wip] },
    { label: 'Promis pour fin 2026', isEnabled: true, progressCategories: [ProgressCategory.PromisedTodo] },
    { label: 'Sans échéance', isEnabled: true, progressCategories: [ProgressCategory.UnpromisedTodo] },
    { label: 'Inconnu', isEnabled: true, progressCategories: [ProgressCategory.Unknown] },
  ]);

  const typeFilters = ref<TypeFilter[]>([
    { label: 'Unidirectionnelle', isEnabled: true, types: [LaneType.Unidirectionnelle] },
    { label: 'Bidirectionnelle', isEnabled: true, types: [LaneType.Bidirectionnelle] },
    { label: 'Bilaterale', isEnabled: true, types: [LaneType.Bilaterale] },
    { label: 'Voie Bus', isEnabled: true, types: [LaneType.VoieBus, LaneType.VoieBusElargie] },
    { label: 'Voie verte', isEnabled: true, types: [LaneType.VoieVerte] },
    { label: 'Vélorue', isEnabled: true, types: [LaneType.Velorue] },
    { label: 'Bandes cyclables', isEnabled: true, types: [LaneType.BandesCyclables] },
    { label: 'Zone de rencontre', isEnabled: true, types: [LaneType.ZoneDeRencontre] },
    { label: 'Aire piétonne', isEnabled: true, types: [LaneType.AirePietonne] },
    { label: 'Chaucidou', isEnabled: true, types: [LaneType.Chaucidou] },
    { label: 'Inconnu', isEnabled: true, types: [LaneType.Inconnu] },
    { label: 'Aucun aménagement', isEnabled: true, types: [LaneType.Aucun] },
  ]);

  const visibleProgressCategories = computed(() =>
    statusFilters.value.filter((filter) => filter.isEnabled).flatMap((filter) => filter.progressCategories),
  );
  const visibleTypes = computed(() =>
    typeFilters.value.filter((filter) => filter.isEnabled).flatMap((filter) => filter.types),
  );

  function toggleStatusFilter(index: number) {
    const statusFilter = statusFilters.value[index];
    if (statusFilter) {
      statusFilter.isEnabled = !statusFilter.isEnabled;
    }
  }

  function toggleTypeFilter(index: number) {
    const typeFilter = typeFilters.value[index];
    if (typeFilter) {
      typeFilter.isEnabled = !typeFilter.isEnabled;
    }
  }

  return { statusFilters, typeFilters, visibleProgressCategories, visibleTypes, toggleStatusFilter, toggleTypeFilter };
}

export type MapFilters = ReturnType<typeof useMapFilters>;
