<template>
  <div class="w-full">
    <img
      src="~/assets/planOfficiel_2022-05-31.jpg"
      class="object-contain w-full h-screen"
      :alt="`plan officiel des ${getRevName()}`"
    >
  </div>
</template>

<script setup lang="ts">
const { getRevName } = useConfig();

const description = `Découvrez le plan officiel des ${getRevName()}, le futur réseau vélo montpelliérain de 235km.`;

useHead({
  title: `Plan des ${getRevName()}`,
  meta: [
    // description
    { name: 'description', content: description },
    { property: 'og:description', content: description },
    { name: 'twitter:description', content: description }
  ]
});
</script>
