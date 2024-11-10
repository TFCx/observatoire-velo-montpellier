<template>
  <div class="w-full">
    <img
      src="https://rouelibre.net/wp-content/uploads/2024/11/2024-06-Plan-Pistes-Bleues.jpg"
      class="object-contain w-full h-screen"
      :alt="`plan officiel des ${getRevName()}`"
    >
  </div>
</template>

<script setup lang="ts">
const { getRevName } = useConfig();

const description = `Découvrez le plan officiel des ${getRevName()}, le réseau vélo de Grand Chambéry.`;
const COVER_IMAGE_URL = 'https://rouelibre.net/wp-content/uploads/2024/11/2024-06-Plan-Pistes-Bleues.jpg';

useHead({
  title: `Plan des ${getRevName()}`,
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
