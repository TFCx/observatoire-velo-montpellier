<template>
  <!-- Largeur du contenu, bornée : pas de blanc inutile sur les côtés, retour à la ligne des textes longs. -->
  <div class="line-hover-tooltip not-prose text-gray-900 w-max max-w-72">
    <div class="py-1 bg-zinc-100 flex flex-row items-center justify-center space-x-1">
      <div
        v-for="line in lines"
        :key="line"
        class="h-7 min-w-7 px-2 rounded-full flex items-center justify-center text-white text-sm font-bold"
        :style="`background-color: ${getLineColor(line)}`"
      >
        {{ line }}
      </div>
    </div>
    <div class="px-3 py-1 flex flex-col items-center gap-1 text-center">
      <div class="text-sm font-semibold break-words">{{ feature.properties.name }}</div>
      <div class="text-xs break-words">{{ typeLabel }} de {{ roundedLengthInMeters }} m</div>
      <div class="text-xs font-medium" :class="status.class">{{ statusText }}</div>
      <QualityBadge :qualities="qualities" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { LaneType, type SectionFeature } from '~/types';
import QualityBadge from './QualityBadge.vue';
import { getDisplayedQualities } from '~/domain/sections';

const { getLineColor } = useColors();
const { getDistance } = useStats();
const { getSectionStatus, getSectionTypeText } = useSectionText();

const { feature, lines } = defineProps<{
  feature: SectionFeature;
  lines: string[];
}>();

const status = computed(() => getSectionStatus(feature.properties));
// « Inconnu de 850 m » ne dit rien d'utile, notamment pour un tronçon pas encore construit.
const typeLabel = computed(() =>
  feature.properties.type === LaneType.Inconnu && !feature.properties.typeB ? 'Tronçon' : getSectionTypeText(feature),
);
const qualities = computed(() => getDisplayedQualities(feature));
const statusText = computed(() => [status.value.label, status.value.date].filter(Boolean).join(' '));
// Arrondi au pas de 25 m, comme le tooltip du clic : une longueur au mètre près serait trompeuse.
const roundedLengthInMeters = computed(() => Math.round(getDistance([feature]) / 25) * 25);
</script>
