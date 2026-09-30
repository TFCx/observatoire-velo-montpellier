<template>
  <span
    class="quality-badge inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium text-gray-900"
    :class="appearance.class"
  >
    <Icon :name="appearance.icon" class="h-3.5 w-3.5" />
    {{ qualityToDescription[quality] }}
  </span>
</template>

<script setup lang="ts">
import { Quality } from '~/types';

const { qualityToDescription } = useStats();

const { quality } = defineProps<{
  quality: Quality;
}>();

// Mêmes couleurs que la légende et la carte en visualisation « qualité » (tailwind.config.js) ;
// l'icône double la couleur, pour qui distingue mal le vert du rouge.
const APPEARANCE_BY_QUALITY: Record<Quality, { class: string; icon: string }> = {
  [Quality.Good]: { class: 'bg-legend-quality-good border-green-700', icon: 'mdi:check-bold' },
  [Quality.Fair]: { class: 'bg-legend-quality-fair border-yellow-600', icon: 'mdi:exclamation-thick' },
  [Quality.Bad]: { class: 'bg-legend-quality-bad border-red-700', icon: 'mdi:close-thick' },
  [Quality.Inconnu]: { class: 'bg-gray-100 border-gray-400', icon: 'mdi:help' },
};

const appearance = computed(() => APPEARANCE_BY_QUALITY[quality]);
</script>
