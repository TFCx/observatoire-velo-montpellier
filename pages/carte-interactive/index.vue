<template>
  <ClientOnly>
    <Map :features="features" :options="{ geolocation: true }" class="h-full w-full" />
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
