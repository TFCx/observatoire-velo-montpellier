<template>
  <div class="h-full w-full flex flex-col">
    <ClientOnly>
      <Map :features="features" :options="{ logo: false }" class="flex-1" />
    </ClientOnly>
    <div>
      <div class="py-2 px-5 md:px-8 text-white bg-lvv-blue-600 font-semibold text-base">
        {{ doneDistance }} km du Réseau cyclable à Haut Niveau de Service réalisés, réseau nommé "{{ getRevName() }}" depuis 2024
      </div>
      <div class="py-5 px-5 md:px-8 grid grid-cols-3 gap-3 sm:grid-cols-5">
        <div
          v-for="year in years"
          :key="year.label"
          @click="year.isChecked = !year.isChecked"
        >
          <div
            class="border rounded-md py-3 px-3 flex items-center justify-center text-sm font-medium uppercase sm:flex-1 cursor-pointer focus:outline-none"
            :class="{
              'bg-velocite-yellow-5 border-transparent text-white hover:bg-lvv-blue-500': year.isChecked,
              'bg-white border-gray-200 text-gray-900 hover:bg-gray-50': !year.isChecked
            }"
          >
            <div>{{ year.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { getAllUniqLineStrings, getDistance } = useStats();
const { getRevName } = useConfig();

// https://github.com/nuxt/framework/issues/3587
definePageMeta({
  pageTransition: false,
  layout: 'fullscreen'
});

const years = ref([
  { label: '< 2000', match: (year) => year < 2000, isChecked: true },
  { label: 'A DATER', match: (year) => year === 2000, isChecked: false },
  { label: '2002-2014', match: year => year >= 2002 && year < 2015, isChecked: false },
  { label: '2015-2020', match: year => year >= 2015 && year < 2021, isChecked: false },
  { label: '2021-2026', match: year => year >= 2021 && year < 2026, isChecked: false }
]);

const { data: voies } = await useAsyncData(() => {
  return queryContent('voies-cyclables').where({ _type: 'json' }).find();
});

const features = computed(() => {
  return voies.value.map(voie => voie.features)
    .flat()
    .filter(feature => feature.properties.status === 'done')
    .filter(feature => {
      if (!feature.properties.doneAt) { return false; }
      const selectedYear = years.value.filter(year => year.isChecked);
      const [,, featureYear] = feature.properties.doneAt.split('/');
      return selectedYear.some(year => year.match(Number(featureYear)));
    });
});

const doneDistance = computed(() => {
  const allUniqFeatures = getAllUniqLineStrings([{ type: 'FeatureCollection', features: features.value }]);
  const doneDistance = getDistance(allUniqFeatures);
  return Math.round(doneDistance / 100) / 10;
});
</script>
