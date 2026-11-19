<template>
  <!-- `cover:` laissé vide dans le front matter vaut null en YAML ; ContentFrame attend une image ou rien. -->
  <ContentFrame :description="voie.description" :image-url="voie.cover ?? undefined">
    <template #header>
      <h1 class="text-3xl text-center leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
        <div
          class="mt-2 px-3 py-1 rounded-full flex items-center justify-center text-white font-bold mx-auto"
          :style="`background-color: white`"
        >
          <div
            class="mt-2 px-3 py-1 rounded-full flex items-center justify-center text-white font-bold mx-auto"
            :style="`background-color: ${getLineColor(voie.line)}`"
          >
            {{ voie.lineName }}
          </div>
        </div>
      </h1>
    </template>
    <h2>Aperçu</h2>
    <Overview :voie="voie" :geojson="geojson" />
    <ContentRenderer :value="voie" />
  </ContentFrame>
</template>

<script setup lang="ts">
import type { VoiesCyclablesGeojsonCollectionItem, VoiesCyclablesPagesCollectionItem } from '@nuxt/content';

const { getLineColor } = useColors();

const { voie, geojson } = defineProps<{
  voie: VoiesCyclablesPagesCollectionItem;
  geojson: VoiesCyclablesGeojsonCollectionItem;
}>();
</script>
