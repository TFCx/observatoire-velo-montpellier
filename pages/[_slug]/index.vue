<template>
  <div>
    <VoieCyclableDetails :voie="voie" />

    <AssoCallToAaction class="pb-10" />
  </div>
</template>

<script setup>
const { path } = useRoute();
const { getRevName } = useConfig();
const { getLineIdRegex } = useUrl();

const regex = getLineIdRegex();
const line = path.match(regex)[1];

// https://github.com/nuxt/framework/issues/3587
definePageMeta({
  pageTransition: false,
  middleware: 'voie-cyclable',
});

const { data: voie } = await useAsyncData(`${path}`, () => {
  const lineInteger = Number(line);
  const lineId = !Number.isNaN(lineInteger) ? lineInteger : line;
  return queryCollection('voiesCyclablesPages').where('line', '=', lineId).first();
});

const description = `Tout savoir sur la ${getRevName('singular')} ${voie.value.line} ${voie.value.from} ${voie.value.to}. Avancement, carte interactive, détail rue par rue, calendrier des travaux et photos du projet.`;
useShareImage(voie.value.cover);
useHead({
  title: `${getRevName('singular')} ${voie.value.line} ${voie.value.from} ${voie.value.to}`,
  meta: [
    // description
    { name: 'description', content: description },
    { property: 'og:description', content: description },
    { name: 'twitter:description', content: description },
  ],
});
</script>
