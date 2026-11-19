<template>
  <aside aria-label="Filtres" class="h-full w-[415px] shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-4">
    <div class="flex items-center justify-between">
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

const { filters } = defineProps<{ filters: MapFilters }>();

const emit = defineEmits<{ close: [] }>();
</script>
