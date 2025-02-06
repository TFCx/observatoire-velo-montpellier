<template>
  <div class="max-w-2xl mx-auto bg-gray-200 rounded-full flex overflow-hidden my-8">
    <div
      class="bg-stats-already-existing text-xs font-medium text-white text-center p-1 leading-none"
      :style="`width: ${stats.alreadyExisting.percent}%`"
    >
      {{ displayPercent(stats.alreadyExisting.percent) }}
    </div>
    <div
      class="bg-stats-done text-xs font-medium text-white text-center p-1 leading-none"
      :style="`width: ${stats.done.percent}%`"
    >
      {{ displayPercent(stats.done.percent) }}
    </div>
    <div
      v-if="stats.wip.distance"
      class="bg-stats-wip text-white text-center"
      :style="`width: ${stats.wip.percent}%; background: repeating-linear-gradient(to right, #152B68, #152B68 1px, transparent 1px, transparent 3px)`"
    />
    <div
      v-if="stats.postponed.distance"
      class="bg-stats-postponed text-xs font-medium text-white text-center p-1 leading-none ml-auto"
      :style="`width: ${stats.postponed.percent}%`"
    >
      <span v-if="stats.postponed.percent > 5">{{ displayPercent(stats.postponed.percent) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Geojson } from '~/types';
const { getStats, displayPercent } = useStats();

const { voies } = defineProps<{
  voies: Geojson[];
}>();

const stats = getStats(voies);
</script>
