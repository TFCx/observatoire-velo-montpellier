<template>
  <div class="relative my-8 p-2 pt-6 border-color-primary-primary border-2 rounded-xl">
    <div class="absolute -top-4 left-0 right-0 w-fit rounded-md px-2 py-1 mx-auto text-center text-lg text-gray-900 text-white bg-color-primary-primary">
      Type & Qualité des aménagements
    </div>
    <div class="grid grid-cols-[1fr_2px_4fr_auto] gap-x-4 text-color-primary-primary">
      <template v-for="stat in stats.doneAndWip" :key="stat.name">
        <div class="font-semibold text-base sm:text-base text-right whitespace-nowrap">
          {{ stat.get("name") }}
        </div>
        <div class="bg-color-primary-primary" />
        <div class="flex items-center">
          <div class="flex grow w-full">
            <div class="h-1 sm:h-2 bg-legend-quality-good rounded-full border border-black border-r-0 rounded-r-none" :style="`width: ${ stat.get('good') }%`" />
            <div class="h-1 sm:h-2 bg-legend-quality-fair border border-black border-l-0 border-r-0 rounded-none" :style="`width: ${ stat.get('fair') }%`" />
            <div class="h-1 sm:h-2 bg-legend-quality-bad rounded-full border border-black border-l-0 rounded-l-none" :style="`width: ${ stat.get('bad') }%`" />
          </div>
        </div>
        <div class="flex justify-end items-center w-auto">
          <div class="shrink-0 text-sm sm:text-base font-semibold text-right w-10">
            {{ stat.get("percent") }}%
          </div>
        </div>
      </template>
      <div class="font-semibold text-base sm:text-base text-right whitespace-nowrap">
          {{ stats.todo.name }}
        </div>
        <div class="bg-color-primary-primary" />
        <div class="flex items-center">
          <div class="flex grow w-full">
            <div class="h-1 sm:h-2 bg-stats-todo rounded-full border border-black" :style="`width: ${ stats.todo.percent }%`" />
          </div>
        </div>
        <div class="flex justify-end items-center w-auto">
          <div class="shrink-0 text-sm sm:text-base font-semibold text-right w-10">
            {{ stats.todo.percent }}%
          </div>
        </div>
    </div>
  </div>
</template>

<script setup>
const { getStatsByTypology } = useStats();

const { voies } = defineProps({
  voies: { type: Array, required: true }
});

const stats = getStatsByTypology(voies);
</script>
