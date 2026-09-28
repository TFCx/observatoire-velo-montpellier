<template>
  <ClientOnly>
    <Map :features="geojson.features" :options="mapOptions" class="h-full w-full" />
  </ClientOnly>
</template>

<script setup>
const route = useRoute();
const { getLineIdRegex } = useUrl();
const { getRevName } = useConfig();

// On lit l'identifiant dans le paramètre "veloligne-X" et non dans le chemin complet
// "/veloligne-X/carte", où l'expression régulière capturerait aussi "/carte".
const regex = getLineIdRegex();
const line = route.params._slug.match(regex)[1];

// https://github.com/nuxt/framework/issues/3587
definePageMeta({
  pageTransition: false,
  layout: 'fullscreen',
  middleware: 'voie-cyclable'
});

const mapOptions = {
  shrink: true,
  onShrinkControlClick: () => {
    const route = useRoute();
    return navigateTo({ path: `/${route.params._slug}` });
  }
};

const { data: voie } = await useAsyncData(`voie-${line}`, () => {
  const lineInteger = Number(line)
  const lineId = !Number.isNaN(lineInteger) ? lineInteger : line
  return queryCollection('voiesCyclablesPages').where('line', '=', lineId).first();
});

// Le .json d'une ligne porte le même nom de fichier (stem) que son .md.
const { data: geojson } = await useAsyncData(`geojson-${line}`, () => {
  return queryCollection('voiesCyclablesGeojson').where('stem', '=', voie.value.stem).first();
});

const description = `Carte de la ${getRevName('singular')} ${line} ${voie.value.from} ${voie.value.to}. Découvrez les tronçons prévus, déjà réalisés, en travaux et ceux reportés après 2026.`;
useHead({
  title: `Carte de la ${getRevName('singular')} ${line}`,
  meta: [
    // description
    { hid: 'description', name: 'description', content: description },
    { hid: 'og:description', property: 'og:description', content: description },
    { hid: 'twitter:description', name: 'twitter:description', content: description }
  ]
});
</script>
