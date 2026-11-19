<template>
  <div>
    <div class="mt-2 text-base font-medium">Filtrer par statut d'avancement</div>
    <div class="mt-2 flex flex-wrap gap-x-2 gap-y-3">
      <div
        v-for="(statusFilter, index) in filters.statusFilters.value"
        :key="statusFilter.label"
        class="px-2 py-1 border rounded-2xl text-sm cursor-pointer focus:outline-none ring-color-primary-primary ring-2"
        :class="{
          'bg-color-primary-primary border-transparent text-white ring-offset-1 hover:bg-color-primary-500':
            statusFilter.isEnabled,
          'bg-white border-gray-200 text-gray-900 hover:bg-gray-50': !statusFilter.isEnabled,
        }"
        @click="filters.toggleStatusFilter(index)"
      >
        {{ statusFilter.label }}
      </div>
    </div>
    <div class="mt-2 text-base font-medium">Filtrer par type d'aménagement</div>
    <div class="mt-2 flex flex-wrap gap-x-2 gap-y-3">
      <div
        v-for="(typeFilter, index) in filters.typeFilters.value"
        :key="typeFilter.label"
        class="px-2 py-1 border rounded-2xl text-sm cursor-pointer focus:outline-none ring-color-primary-primary ring-2"
        :class="{
          'bg-color-primary-primary border-transparent text-white ring-offset-1 hover:bg-color-primary-500':
            typeFilter.isEnabled,
          'bg-white border-gray-200 text-gray-900 hover:bg-gray-50': !typeFilter.isEnabled,
        }"
        @click="filters.toggleTypeFilter(index)"
      >
        {{ typeFilter.label }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MapFilters } from '~/composables/useMapFilters';

const { filters } = defineProps<{ filters: MapFilters }>();
</script>
