<template>
  <div class="max-w-2xl mx-auto mt-8 md:mt-10">
    <p class="text-center">
      <span
        class="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-1.5 text-gray-900"
      >
        <Icon name="mdi:timer-sand" class="h-5 w-5 shrink-0" aria-hidden="true" />
        <span v-if="mandateTime.kind === 'running'">
          Il reste <strong>{{ formatDuration(mandateTime.remaining) }}</strong> avant l'échéance du 31/12/2026
        </span>
        <span v-else>
          Échéance du 31/12/2026 dépassée depuis <strong>{{ formatDuration(mandateTime.overdueBy) }}</strong>
        </span>
      </span>
    </p>

    <div class="mt-6 grid grid-cols-1 gap-x-3 gap-y-1 md:grid-cols-[10rem_minmax(0,1fr)] md:items-center">
      <div class="text-sm text-gray-500 md:text-right">Temps du mandat</div>
      <div class="relative">
        <div class="flex h-6 overflow-hidden rounded-full bg-gray-200">
          <div
            class="flex items-center justify-end bg-gray-700 pr-2 text-xs font-medium whitespace-nowrap text-white"
            :style="`width: ${elapsedPercent}%`"
          >
            {{ elapsedPercent }} % écoulé
          </div>
        </div>
        <TodayMarker :percent="elapsedPercent" />
      </div>
      <div class="hidden md:block" />
      <div class="mb-3 flex justify-between text-xs text-gray-400">
        <span>15/07/2020 · installation du conseil</span>
        <span>31/12/2026</span>
      </div>

      <div class="text-sm text-gray-500 md:text-right">
        Vélolignes promises
        <span class="block text-xs text-gray-400">
          hors existant · {{ displayDistanceInKm(promiseProgress.totalDistance, 1) }}
        </span>
      </div>
      <div class="relative">
        <div class="flex h-6 overflow-hidden rounded-full bg-gray-200">
          <div
            class="flex items-center justify-center bg-stats-done text-xs font-medium text-gray-900"
            :style="`width: ${promiseProgress.done.percent}%`"
          >
            {{ displayPercent(promiseProgress.done.percent) }}
          </div>
          <div
            :style="`width: ${promiseProgress.wip.percent}%; background: repeating-linear-gradient(to right, #665E7B, #665E7B 1px, transparent 1px, transparent 3px)`"
          />
        </div>
        <TodayMarker :percent="elapsedPercent" />
      </div>
    </div>

    <div class="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-gray-500">
      <span>
        <span class="mr-1.5 inline-block h-3 w-3 rounded-sm bg-stats-done align-[-1px]" />
        Réalisé pendant le mandat · {{ displayDistanceInKm(promiseProgress.done.distance, 1) }}
      </span>
      <span>
        <span
          class="mr-1.5 inline-block h-3 w-3 rounded-sm border border-stats-wip align-[-1px]"
          style="
            background: repeating-linear-gradient(to right, #665e7b, #665e7b 1px, transparent 1px, transparent 3px);
          "
        />
        En travaux · {{ displayDistanceInKm(promiseProgress.wip.distance, 1) }}
      </span>
      <span>
        <span class="mr-1.5 inline-block h-3 w-3 rounded-sm bg-gray-200 align-[-1px]" />
        Reste à faire · {{ displayDistanceInKm(promiseProgress.todo.distance, 1) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h } from 'vue';

import { formatDuration, getMandateTime, type CalendarDate } from '~/domain/mandate';
import type { Geojson } from '~/types';

const { voies } = defineProps<{
  voies: Geojson[];
}>();

const { getPromiseProgress, displayDistanceInKm, displayPercent } = useStats();
const promiseProgress = getPromiseProgress(voies);

function readLocalCalendarDate(date: Date): CalendarDate {
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

// Site statique : la page générée porte la date de génération. useState la transmet telle quelle au
// navigateur (pas d'écart à l'hydratation), puis la date du visiteur la remplace.
const today = useState<CalendarDate>('mandate-deadline-today', () => readLocalCalendarDate(new Date()));
onMounted(() => {
  today.value = readLocalCalendarDate(new Date());
});

const mandateTime = computed(() => getMandateTime(today.value));
// Arrondi vers le bas : « 100 % écoulé » n'apparaît qu'une fois l'échéance passée.
const elapsedPercent = computed(() =>
  mandateTime.value.kind === 'running' ? Math.floor(mandateTime.value.elapsedPercent) : 100,
);

// Trait « aujourd'hui » qui traverse les deux barres, pour comparer le temps écoulé à l'avancement.
const TodayMarker = defineComponent({
  props: { percent: { type: Number, required: true } },
  setup(props) {
    return () =>
      h('div', {
        class: 'pointer-events-none absolute -top-1 -bottom-1 border-l-2 border-dashed border-gray-900',
        style: `left: ${props.percent}%`,
        'aria-hidden': 'true',
      });
  },
});
</script>
