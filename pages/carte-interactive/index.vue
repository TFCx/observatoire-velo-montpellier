<template>
  <ClientOnly>
    <Map
      :features="features"
      :line-details="lineDetails"
      :options="{ geolocation: true, sidePanel: true }"
      class="h-full w-full"
    />
  </ClientOnly>
</template>

<script setup>
const { getRevName } = useConfig();

// https://github.com/nuxt/framework/issues/3587
definePageMeta({
  pageTransition: false,
  layout: 'fullscreen',
});

const { data: voies } = await useAsyncData(() => {
  return queryCollection('voiesCyclablesGeojson').all();
});

const { data: limits } = await useAsyncData(() => {
  return queryCollection('limits').all();
});

// Préchargées pour le panneau de détail (ADR 0010) : ~20 Ko compressés de plus pour la page, contre le
// moteur SQLite de Nuxt Content (~400 Ko) qu'une requête au clic téléchargerait.
const { data: pages } = await useAsyncData(() => {
  return queryCollection('voiesCyclablesPages').all();
});

// Le .json d'une ligne porte le même nom de fichier (stem) que son .md.
const lineDetails = pages.value.flatMap((page) => {
  const geojson = voies.value.find((voie) => voie.stem === page.stem);
  return geojson ? [{ line: String(page.line), page, geojson }] : [];
});

const features = voies.value
  .map((voie) => voie.features)
  .flat()
  .concat(limits.value.map((l) => l.features).flat());

const description = `Découvrez la carte interactive des ${getRevName()}. Itinéraires rue par rue. Plan régulièrement mis à jour pour une information complète.`;
useHead({
  title: `Carte à jour des ${getRevName()}`,
  meta: [
    // description
    { name: 'description', content: description },
    { property: 'og:description', content: description },
    { name: 'twitter:description', content: description },
  ],
});
</script>
