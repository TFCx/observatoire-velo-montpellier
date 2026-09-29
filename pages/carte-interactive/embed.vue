<template>
  <ClientOnly>
    <Map :features="features" class="h-full w-full" />
  </ClientOnly>
</template>

<script setup>
const { getRevName } = useConfig();

// https://github.com/nuxt/framework/issues/3587
definePageMeta({
  pageTransition: false,
  layout: 'embed',
});

const { data: voies } = await useAsyncData(() => {
  return queryCollection('voiesCyclablesGeojson').all();
});

const features = voies.value.map((voie) => voie.features).flat();

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
