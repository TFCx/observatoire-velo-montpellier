<template>
  <div class="not-prose text-gray-900 w-48">
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
        <div class="text-base font-bold">
          Tronçon
        </div>
        <div class="text-sm text-center">
          {{ feature.properties.name }}
        </div>
      </div>
      <div class="py-1 flex items-center justify-between">
        <div class="text-sm font-bold">
          Statut
        </div>
        <div>
          <div class="text-sm" :class="getStatus(feature.properties).class">
            {{ getStatus(feature.properties).label }}
          </div>
          <div v-if="getStatus(feature.properties).date" class="italic">
            {{ getStatus(feature.properties).date }}
          </div>
        </div>
      </div>
      <div class="py-1 flex items-center justify-between">
        <div class="text-sm font-bold">
          Longueur
        </div>
        <div class="text-sm">
          {{ Math.round(getDistance([feature]) / 25) * 25 }}m
        </div>
      </div>
      <div class="py-1 flex items-center justify-between">
        <div class="text-sm font-bold">
          Type
        </div>
        <div>
          <div class="text-right">
            {{ laneTypeToDescription[feature.properties.type] ?? 'ERREUR' }}
          </div>
        </div>
      </div>
      <div class="py-1 flex items-center justify-between">
        <div class="text-sm font-bold">
          Qualité
        </div>
        <div>
          <div class="italic text-right">
            {{ qualityToDescription[feature.properties.quality] }}
          </div>
        </div>
      </div>
    </div>
    <div class="bg-velocite-yellow-5 flex justify-center">
      <a class="p-1 text-white text-base italic hover:underline" :href="getSectionDetailsUrl(feature.properties)" target="_blank">
        voir le détail <Icon name="mdi:link-variant" class="h-4 w-4 text-white" />
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LineStringFeature, SectionFeature } from '~/types';

const { getLineColor } = useColors();
const { getRevName } = useConfig();
const { getDistance, laneTypeToDescription, qualityToDescription } = useStats();
const { getVoieCyclablePath } = useUrl();

const { feature, lines } = defineProps<{
  feature: SectionFeature;
  lines: number[];
}>();

const title = computed(() => {
  return lines.length > 1 ? getRevName() : getRevName('singular');
});

function getSectionDetailsUrl(properties: SectionFeature['properties']): string {
  // if (properties.link) {
  //   return properties.link;
  // }
  return getVoieCyclablePath(properties.lines[0]);
}

function getDoneAtText(doneAt: string): string {
  const [day, month, year] = doneAt.split('/');
  const isBeforeMandat =
    new Date(Number(year), Number(month) - 1, Number(day)).getTime() < new Date(2021, 0, 1).getTime();
  if (isBeforeMandat) {
    return 'avant 2021';
  }
  return `le ${doneAt}`;
}

function getStatus(properties: SectionFeature['properties']): { label: string, class: string; date?: string } {
  const statusMapping = {
    done: {
      label: 'terminé',
      date: properties.doneAt && getDoneAtText(properties.doneAt),
      class: 'text-white bg-velocite-yellow-5 rounded-xl px-2 w-fit'
    },
    wip: {
      label: 'en travaux',
      class: 'text-velocite-yellow-5 rounded-xl px-2 border border-dashed border-velocite-yellow-5'
    },
    planned: {
      label: 'prévu',
      class: 'text-velocite-yellow-5 rounded-xl px-2 border border-velocite-yellow-5'
    },
    tested: {
      label: 'en test',
      class: 'text-lvv-blue-600 rounded-xl px-2 border border-dashed border-lvv-blue-600'
    },
    postponed: {
      label: 'reporté',
      date: 'après 2026',
      class: 'text-white bg-lvv-pink rounded-xl px-2'
    },
    variante: {
      label: 'variante',
      class: ''
    },
    'variante-postponed': {
      label: 'variante reportée',
      date: 'après 2026',
      class: 'text-white bg-lvv-pink rounded-xl px-2'
    },
    unknown: {
      label: 'à définir',
      class: 'text-gray-900 bg-gray-200 rounded-xl px-2'
    }
  };
  return statusMapping[properties.status];
}
</script>
