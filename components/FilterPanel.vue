<template>
  <aside
    aria-label="Filtres"
    class="overflow-y-auto bg-white px-4 pb-4"
    :class="display === 'side-panel' ? 'h-full w-[415px] shrink-0 border-l border-gray-200 pt-4' : 'min-h-0 flex-1'"
  >
    <!-- data-bottom-sheet-handle : dans le bottom sheet, l'en-tête sert aussi à régler sa hauteur. -->
    <div
      data-bottom-sheet-handle
      class="flex items-center justify-between"
      :class="{ 'touch-none': display === 'bottom-sheet' }"
    >
      <h2 class="text-lg font-medium leading-6 text-gray-900">Filtres</h2>
      <button
        type="button"
        aria-label="Fermer les filtres"
        class="rounded-md p-1 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        @click="emit('close')"
      >
        <Icon name="mdi:close" class="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
    <FilterForm :filters="filters" />
  </aside>
</template>

<script setup lang="ts">
import FilterForm from '~/components/filter/FilterForm.vue';
import type { MapFilters } from '~/composables/useMapFilters';
import type { PanelDisplay } from '~/domain/bottomSheet';

const { filters, display } = defineProps<{ filters: MapFilters; display: PanelDisplay }>();

const emit = defineEmits<{ close: [] }>();
</script>
