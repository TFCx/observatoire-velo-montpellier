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
  layout: 'fullscreen'
});

const { data: voies } = await useAsyncData(() => {
  return queryContent('voies-cyclables').where({ _type: 'json' }).find();
});

const { data: limits } = await useAsyncData(() => {
  return queryContent('limits').where({ _type: 'json' }).find();
});

const features = voies.value.map(voie => voie.features).flat().concat(limits.value.map(l => l.features).flat());

const description =
  `Découvrez la carte interactive des ${getRevName()}. Itinéraires rue par rue. Plan régulièrement mis à jour pour une information complète.`;
const COVER_IMAGE_URL = 'https://observatoire-velo-montpellier.netlify.app/_nuxt/logoCyclopolisVGM.CzJjkGQi.png';
useHead({
  title: `Carte à jour des ${getRevName()}`,
  meta: [
    // description
    { hid: 'description', name: 'description', content: description },
    { hid: 'og:description', property: 'og:description', content: description },
    { hid: 'twitter:description', name: 'twitter:description', content: description },
    // cover image
    { hid: 'og:image', property: 'og:image', content: COVER_IMAGE_URL },
    { hid: 'twitter:image', name: 'twitter:image', content: COVER_IMAGE_URL }
  ]
});
</script>
