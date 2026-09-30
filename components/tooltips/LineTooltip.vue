<template>
  <div class="not-prose text-gray-900 w-max min-w-60 max-w-80">
    <div class="py-1 bg-zinc-100 flex flex-col items-center justify-center">
      <div class="font-bold text-base">
        {{ title }}
      </div>
      <div class="flex flex-row space-x-1">
        <div
          v-for="line in lines"
          :key="line"
          class="px-3 py-1 rounded-full flex items-center justify-center text-white text-base font-bold"
          :style="`background-color: ${getLineColor(line)}`"
        >
          {{ line }}
        </div>
      </div>
    </div>
    <div class="px-2 divide-y">
      <div class="py-1 flex flex-col items-center">
        <div class="text-base font-bold">Tronçon</div>
        <div class="text-sm text-center break-words">
          {{ feature.properties.name }}
        </div>
      </div>
      <div class="py-1 flex items-center justify-between">
        <div class="text-sm font-bold mr-2">Statut</div>
        <div class="flex flex-col items-end text-sm" :class="getSectionStatus(feature.properties).class">
          <div>{{ getSectionStatus(feature.properties).label }}</div>
          <div v-if="getSectionStatus(feature.properties).date" class="italic">
            {{ getSectionStatus(feature.properties).date }}
          </div>
        </div>
      </div>
      <div class="py-1 flex items-center justify-between">
        <div class="text-sm font-bold mr-2">Longueur</div>
        <div class="text-sm">{{ Math.round(getDistance([feature]) / 25) * 25 }}m</div>
      </div>
      <div class="py-1 flex items-center justify-between">
        <div class="text-sm font-bold mr-2">Type</div>
        <div class="min-w-0 text-right break-words">
          {{ getSectionTypeText(feature) }}
        </div>
      </div>
      <!-- Deux qualités ne tiennent pas à côté du libellé : la capsule passe alors à la ligne, à droite. -->
      <div v-if="qualities.length > 0" class="py-1 flex flex-wrap items-center justify-between gap-y-1">
        <div class="text-sm font-bold mr-2">Qualité</div>
        <QualityBadge :qualities="qualities" class="ml-auto" />
      </div>
    </div>
    <div class="bg-color-primary-primary flex justify-center">
      <a
        class="p-1 text-white text-base italic hover:underline"
        :href="getSectionDetailsUrl(feature.properties)"
        target="_blank"
      >
        voir le détail <Icon name="mdi:link-variant" class="h-4 w-4 text-white" />
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SectionFeature } from '~/types';
import QualityBadge from './QualityBadge.vue';
import { getDisplayedQualities } from '~/domain/sections';

const { getLineColor } = useColors();
const { getRevName } = useConfig();
const { getDistance } = useStats();
const { getSectionStatus, getSectionTypeText } = useSectionText();
const { getVoieCyclablePath } = useUrl();

const { feature, lines } = defineProps<{
  feature: SectionFeature;
  lines: number[];
}>();

const qualities = computed(() => getDisplayedQualities(feature));

const title = computed(() => {
  return lines.length > 1 ? getRevName() : getRevName('singular');
});

function getSectionDetailsUrl(properties: SectionFeature['properties']): string {
  return properties.links[0] ?? getVoieCyclablePath(properties.lines[0] ?? '');
}
</script>
