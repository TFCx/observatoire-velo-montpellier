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
    <section v-if="showMap" aria-labelledby="shipping-heading" class="mt-10">
      <ClientOnly>
        <Map :features="features" :options="mapOptions" style="height: 40vh" />
      </ClientOnly>
    </section>
  </div>
</template>

<script setup>
const { getLineColor } = useColors();
const { getTotalDistance, displayDistanceInKm } = useStats();

// geojson : tracés de la Véloligne, chargés par la page qui l'affiche (une page de Véloligne ou le
// panneau de la carte interactive, qui les a déjà tous).
// showMap : le panneau de la carte interactive n'affiche pas une seconde carte (ADR 0010).
const { voie, geojson, showMap } = defineProps({
  voie: { type: Object, required: true },
  geojson: { type: Object, required: true },
  showMap: { type: Boolean, default: true },
});

const mapOptions = {
  fullscreen: false,
  logo: false,
  defaultLayer: DisplayedLayer.Quality,
};

const features = geojson.features;

const color = getLineColor(voie.line);
const distance = getTotalDistance([geojson]);
</script>
