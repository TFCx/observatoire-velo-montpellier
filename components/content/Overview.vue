<template>
  <div>
    <div>
      <div class="text-center text-xl text-gray-900">
        Distance totale :
        <span class="font-bold" :style="`color: ${color}`">{{ displayDistanceInKm(distance, 1) }}</span>
      </div>
      <ProgressBar :voies="[geojson]" />
      <Stats :voies="[geojson]" :precision="1" />
      <Typology :voies="[geojson]" />
    </div>
    <section aria-labelledby="shipping-heading" class="mt-10">
      <ClientOnly>
        <Map :features="features" :options="mapOptions" style="height: 40vh" />
      </ClientOnly>
    </section>
  </div>
</template>

<script setup>
const { path } = useRoute();
const { getLineColor } = useColors();
const { getTotalDistance, displayDistanceInKm } = useStats();

const { voie } = defineProps({ voie: { type: Object, required: true } });

const mapOptions = {
  fullscreen: false,
  logo: false,
  defaultLayer: DisplayedLayer.Quality,
};

const { data: geojson } = await useAsyncData(`geojson-${path}`, () => {
  // Le .json d'une ligne porte le même nom de fichier (stem) que son .md.
  return queryCollection('voiesCyclablesGeojson').where('stem', '=', voie.stem).first();
});

const features = geojson.value.features;

const color = getLineColor(voie.line);
const distance = getTotalDistance([geojson.value]);
</script>
