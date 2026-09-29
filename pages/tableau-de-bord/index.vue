<template>
  <div class="max-w-4xl mx-auto mt-14 px-4 sm:px-6 lg:px-8 lg:mt-24">
    <h1 class="text-center text-3xl text-color-primary-600 font-bold mb-8">
      Tableau de bord de suivi des {{ config.revName.plural }}
    </h1>
    <div v-if="!voies">Chargement ...</div>
    <div v-else>
      <ProgressBar :voies="voies" />
      <Stats :voies="voies" :precision="1" class="mt-8 max-w-2xl mx-auto" />
      <Typology :voies="voies" class="mt-8 max-w-2xl mx-auto" />

      <div v-for="voie in voies" :key="getLine(voie)" class="py-2 my-8 flex">
        <div class="mr-4 w-2 lg:w-4 rounded-lg" :style="`background: ${getLineColor(getLine(voie))}`" />
        <div class="max-w-2xl mx-auto flex-grow">
          <h2 class="text-center text-2xl font-bold">
            <LineLink :line="String(getLine(voie))" />
          </h2>
          <div class="text-center text-xl text-gray-900">
            Distance totale:
            <span class="font-bold" :style="`color: ${getLineColor(getLine(voie))}`">
              {{ displayDistanceInKm(getTotalDistance([voie]), 1) }}
            </span>
          </div>
          <div v-if="hasTrafic(voie)" class="text-center text-sm text-gray-900">
            Fréquentation max 2030:
            <span class="font-bold" :style="`color: ${getLineColor(getLine(voie))}`">
              {{ getTrafic(voie) }}
            </span>
          </div>
          <div>
            <ProgressBar :voies="[voie]" />
            <Stats :voies="[voie]" :precision="1" class="mt-8" />
            <Typology :voies="[voie]" class="mt-8 max-w-2xl mx-auto" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import config from '../../config.json';
import { isLineStringFeature, type Geojson } from '~/types';

const { getLineColor } = useColors();
const { getTotalDistance, displayDistanceInKm } = useStats();

const { data: voies } = await useAsyncData(async () => {
  // Même schéma que Geojson (ADR 0008), mais Nuxt Content régénère ses types via JSON Schema, où nos
  // enums TypeScript deviennent de simples chaînes : TypeScript ne les juge plus compatibles.
  return (await queryCollection('voiesCyclablesGeojson').all()) as unknown as Geojson[];
});
const { data: mds } = await useAsyncData(() => {
  return queryCollection('voiesCyclablesPages').all();
});

function getLine(voie: Geojson): string {
  return voie.features.find(isLineStringFeature)?.properties.line ?? '';
}

function hasTrafic(voie: Geojson): boolean {
  const line = getLine(voie);
  const trafic = mds.value?.find((md) => md.line === line)?.trafic;
  return trafic != null;
}

function getTrafic(voie: Geojson): string {
  const line = getLine(voie);
  const trafic = mds.value?.find((md) => md.line === line)?.trafic;
  return trafic || 'Inconnu';
}

const description = `Tableau de bord de suivi des ${config.revName.plural} en temps réel.`;
useHead({
  title: `Tableau de bord de suivi des ${config.revName.plural}`,
  meta: [
    { name: 'description', content: description },
    { property: 'og:description', content: description },
    { name: 'twitter:description', content: description },
  ],
});
</script>
