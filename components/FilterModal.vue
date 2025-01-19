<template>
  <Dialog :open="isOpen" class="relative z-50" @close="closeModal">
    <!-- backdrop-->
    <div class="fixed inset-0 bg-black/30" aria-hidden="true" />

    <!-- dialog itself-->
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="relative p-4 w-full max-w-sm rounded bg-white">
        <button
          type="button"
          class="absolute top-1 right-1 bg-white rounded-md p-1 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          @click="closeModal"
        >
          <Icon name="mdi:close" class="h-6 w-6" aria-hidden="true" />
        </button>
        <DialogTitle class="text-lg font-medium leading-6 text-gray-900">
          Filtres
        </DialogTitle>

        <div class="mt-2 text-base font-medium">
          Filtrer par statut d'avancement
        </div>
        <div class="mt-2 flex flex-wrap gap-x-2 gap-y-3">
          <div
            v-for="(statusFilter, index) in statusFilters"
            :key="statusFilter.label"
            class="px-2 py-1 border rounded-2xl text-sm cursor-pointer focus:outline-none ring-velocite-yellow-5 ring-2"
            :class="{
              'bg-velocite-yellow-5 border-transparent text-white ring-offset-1 hover:bg-lvv-blue-500': statusFilter.isEnable,
              'bg-white border-gray-200 text-gray-900 hover:bg-gray-50': !statusFilter.isEnable
            }"
            @click="toogleStatusFilter(index)"
          >
            {{ statusFilter.label }}
          </div>
        </div>
        <div class="mt-2 text-base font-medium">
          Filtrer par type d'aménagement
        </div>
        <div class="mt-2 flex flex-wrap gap-x-2 gap-y-3">
          <div
            v-for="(typeFilter, index) in typeFilters"
            :key="typeFilter.label"
            class="px-2 py-1 border rounded-2xl text-sm cursor-pointer focus:outline-none ring-velocite-yellow-5 ring-2"
            :class="{
              'bg-velocite-yellow-5 border-transparent text-white ring-offset-1 hover:bg-lvv-blue-500': typeFilter.isEnable,
              'bg-white border-gray-200 text-gray-900 hover:bg-gray-50': !typeFilter.isEnable
            }"
            @click="toogleTypeFilter(index)"
          >
            {{ typeFilter.label }}
          </div>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';
import { LaneStatus, LaneType } from '~/types';

const isOpen = ref(false);

function closeModal() {
  isOpen.value = false;
}
function openModal() {
  isOpen.value = true;
}

defineExpose({
  openModal
});

const statusFilters = ref([
  { label: 'Terminé', isEnable: true, statuses: [LaneStatus.Done] },
  { label: 'En travaux', isEnable: true, statuses: [LaneStatus.Wip, LaneStatus.Tested] },
  { label: 'Prévu pour 2026', isEnable: true, statuses: [LaneStatus.Planned, LaneStatus.Variante] },
  { label: 'Reporté', isEnable: true, statuses: [LaneStatus.Postponed, LaneStatus.VariantePostponed] },
  { label: 'Inconnu', isEnable: true, statuses: [LaneStatus.Unknown] }
]);

const typeFilters = ref([
  { label: 'Unidirectionnelle', isEnable: true, types: [LaneType.Unidirectionnelle] },
  { label: 'Bidirectionnelle', isEnable: true, types: [LaneType.Bidirectionnelle] },
  { label: 'Bilaterale', isEnable: true, types: [LaneType.Bilaterale] },
  { label: 'Voie Bus', isEnable: true, types: [LaneType.VoieBus, LaneType.VoieBusElargie] },
  { label: 'Voie verte', isEnable: true, types: [LaneType.VoieVerte] },
  { label: 'Vélorue', isEnable: true, types: [LaneType.Velorue] },
  { label: 'Bandes cyclables', isEnable: true, types: [LaneType.BandesCyclables] },
  { label: 'Zone de rencontre', isEnable: true, types: [LaneType.ZoneDeRencontre] },
  { label: 'Aire piétonne', isEnable: true, types: [LaneType.AirePietonne] },
  { label: 'Chaucidou', isEnable: true, types: [LaneType.Chaucidou] },
  { label: 'Inconnu', isEnable: true, types: [LaneType.Inconnu] },
  { label: 'Aucun aménagement', isEnable: true, types: [LaneType.Aucun] },
]);

function toogleStatusFilter(index: number) {
  statusFilters.value[index].isEnable = !statusFilters.value[index].isEnable;
}

function toogleTypeFilter(index: number) {
  typeFilters.value[index].isEnable = !typeFilters.value[index].isEnable;
}

const emit = defineEmits(['update']);

watch([statusFilters, typeFilters], () => {
  const visibleStatuses = statusFilters.value
    .filter(item => item.isEnable)
    .flatMap(item => item.statuses);

  const visibleTypes = typeFilters.value
    .filter(item => item.isEnable)
    .flatMap(item => item.types);

  emit('update', { visibleStatuses, visibleTypes });
}, { deep: true });

</script>
