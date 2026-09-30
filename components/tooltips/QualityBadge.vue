<template>
  <div v-if="qualities.length > 0" class="quality-badge flex flex-col items-center gap-0.5">
    <span class="inline-flex whitespace-nowrap">
      <span
        v-for="(quality, index) in qualities"
        :key="quality"
        :class="[SECTION_PILL_CLASS, BORDER_CLASS_BY_QUALITY[quality], halfCapsuleClass(index)]"
      >
        <Icon :name="ICON_BY_QUALITY[quality].name" class="h-3.5 w-3.5" :class="ICON_BY_QUALITY[quality].class" />
        {{ qualityToDescription[quality] }}
      </span>
    </span>
    <span v-if="qualities.length > 1" class="text-[10px] italic text-gray-500">selon le sens de circulation</span>
  </div>
</template>

<script setup lang="ts">
import { Quality } from '~/types';

const { qualityToDescription } = useStats();
const { SECTION_PILL_CLASS } = useSectionText();

// Une qualité, ou deux quand les deux sens de circulation diffèrent (getDisplayedQualities).
const { qualities } = defineProps<{
  qualities: Quality[];
}>();

// Teintes de la légende et de la carte, en plus foncé : les couleurs de la légende, pensées pour des
// aplats, seraient illisibles en bord ou en icône sur fond blanc (le jaune surtout). L'icône double
// la couleur, pour qui distingue mal le vert du rouge.
const BORDER_CLASS_BY_QUALITY: Record<Quality, string> = {
  [Quality.Good]: 'border-green-600',
  [Quality.Fair]: 'border-yellow-600',
  [Quality.Bad]: 'border-red-600',
  [Quality.Inconnu]: 'border-gray-400',
};
const ICON_BY_QUALITY: Record<Quality, { name: string; class: string }> = {
  [Quality.Good]: { name: 'mdi:check-bold', class: 'text-green-600' },
  [Quality.Fair]: { name: 'mdi:exclamation-thick', class: 'text-yellow-600' },
  [Quality.Bad]: { name: 'mdi:close-thick', class: 'text-red-600' },
  [Quality.Inconnu]: { name: 'mdi:help', class: 'text-gray-500' },
};

// Deux qualités : une capsule en deux moitiés, sans bord commun doublé.
function halfCapsuleClass(index: number): string {
  if (qualities.length < 2) {
    return '';
  }
  return index === 0 ? 'rounded-r-none border-r-0' : 'rounded-l-none';
}
</script>
