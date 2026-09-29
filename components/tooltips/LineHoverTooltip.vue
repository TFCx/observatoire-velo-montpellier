<template>
  <div class="line-hover-tooltip not-prose text-gray-900 w-52">
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
    <div class="px-2 py-1 flex flex-col items-center gap-1 text-center">
      <div class="text-sm font-semibold">{{ feature.properties.name }}</div>
      <div class="text-xs">{{ getSectionTypeText(feature) }} de {{ roundedLengthInMeters }} m</div>
      <div class="text-xs" :class="status.class">{{ statusText }}</div>
      <div class="text-xs italic">Qualité : {{ getSectionQualityText(feature) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SectionFeature } from '~/types';

const { getLineColor } = useColors();
const { getDistance } = useStats();
const { getSectionStatus, getSectionTypeText, getSectionQualityText } = useSectionText();

const { feature, lines } = defineProps<{
  feature: SectionFeature;
  lines: string[];
}>();

const status = computed(() => getSectionStatus(feature.properties));
const statusText = computed(() => [status.value.label, status.value.date].filter(Boolean).join(' '));
// Arrondi au pas de 25 m, comme le tooltip du clic : une longueur au mètre près serait trompeuse.
const roundedLengthInMeters = computed(() => Math.round(getDistance([feature]) / 25) * 25);
</script>
