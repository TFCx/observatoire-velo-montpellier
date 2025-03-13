<template>
  <div class="relative z-50" v-show="isExpanded">
    <div class="fixed p-2 bottom-5">
      <div class="relative p-4 w-full max-w-sm rounded-xl bg-white">
        <button
          type="button"
          class="absolute top-1 right-1 bg-white rounded-md p-1 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          @click="reduceLegend"
        >
          <Icon name="mdi:close" class="h-6 w-6" aria-hidden="true" />
        </button>
        <div class="text-sm font-medium leading-4 text-gray-900 italic">
          Légende
        </div>
        <div class="mt-2">
          <div v-if="true">
          </div>
          <div v-if="layerDisplayed==0">
            <div class="grid grid-cols-[64px_1fr] gap-x-4">

              <div class="col-span-2 font-bold text-center">
                <hr class="mb-1 border-gray-500">
                Avancement du réseau
                <hr class="mb-1 border-gray-500">
              </div>
              <div class="my-auto rounded-md border-gray-500 border">
                <div class="h-1 bg-color-primary-primary" />
              </div>
              <div>
                Terminé
              </div>

              <div class="my-auto rounded-md border-gray-500 border">
                <div class="h-1 relative">
                  <div class="h-full w-full">
                    <div class="myrelative h-full w-full">
                      <div class="myabsolute h-full w-full bg-color-primary-primary dashed-line" />
                      <div class="myabsolute h-full w-full bg-color-primary-primary animated-opacity" />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                En travaux
              </div>

              <div class="my-auto border-gray-500 border">
                <div class="h-2 relative">
                  <div class="absolute h-full w-full">
                    <div class="h-0.5 bg-color-primary-primary" />
                    <div class="h-1 bg-color-primary-primary dashed-line" />
                    <div class="h-0.5 bg-color-primary-primary" />
                  </div>
                </div>
              </div>
              <div>
                Prévu pour 2026
              </div>

              <div class="my-auto rounded-md border-gray-500 border relative">
                <div class="h-1 bg-white" />
                <div class="myabsolute h-full w-full bg-color-primary-primary dashed-line opacity-30 " />
                <div class="text-gray-500 font-bold absolute -top-2 opacity-65 ">
                  ✕ ✕ ✕
                </div>
              </div>
              <div>
                Reporté après 2026
              </div>
            </div>
          </div>

          <div v-if="layerDisplayed==1">
            <div class="grid grid-cols-[64px_1fr] gap-x-4">
              <div class="col-span-2 font-bold text-center">
                <hr class="mb-1 border-gray-500">
                Évaluation de la qualité
                <hr class="mb-1 border-gray-500">
              </div>
              <div class="my-auto rounded-md border-gray-500 border">
                <div class="h-1 bg-legend-quality-good" />
              </div>
              <div>
                Satisfaisant
              </div>

              <div class="my-auto rounded-md border-gray-500 border">
                <div class="h-1 bg-legend-quality-fair" />
              </div>
              <div>
                À améliorer
              </div>

              <div class="my-auto rounded-md border-gray-500 border">
                <div class="h-1 bg-legend-quality-bad" />
              </div>
              <div>
                Non satisfaisant
              </div>
            </div>
          </div>

          <div v-if="layerDisplayed==2">
            <div class="grid grid-cols-[64px_1fr] gap-x-4">
              <div class="col-span-2 font-bold text-center">
                <hr class="mb-1 border-gray-500">
                Catégories principales
                <hr class="mb-1 border-gray-500">
              </div>
              <div class="my-auto rounded-md border-gray-500 border">
                <div class="h-1 bg-legend-infra-family-dedie" />
              </div>
              <div>
                Aménagements dédiés
              </div>

              <div class="my-auto rounded-md border-gray-500 border">
                <div class="h-1 bg-legend-infra-family-mix-motor" />
              </div>
              <div>
                Mixité avec motorisés
              </div>

              <div class="my-auto rounded-md border-gray-500 border">
                <div class="h-1 bg-legend-infra-family-mix-ped" />
              </div>
              <div>
                Cohabitation avec piétons
              </div>
            </div>
          </div>

          <div v-if="layerDisplayed==3">
            <div class="grid grid-cols-[64px_1fr] gap-x-2">

              <div class="col-span-2 font-bold text-center">
                <hr class="mb-1 border-gray-500">
                Futur réseau
                <hr class="mb-1 border-gray-500">
              </div>

              <div class="my-auto rounded-md border-gray-500 border">
                <div class="h-2 bg-gray-400" />
              </div>
              <div>
                Anneau vélo
              </div>

              <div class="flex grow w-full items-center">
                <div class="h-2 bg-emerald-400 rounded-full border border-black border-r-0 rounded-r-none" style="width: 16%;"></div>
                <div class="h-2 bg-teal-700 border border-black border-l-0 border-r-0 rounded-none" style="width: 16%;"></div>
                <div class="h-2 bg-yellow-400 border border-black border-l-0 border-r-0 rounded-none" style="width: 16%;"></div>
                <div class="h-2 bg-violet-400 border border-black border-l-0 border-r-0 rounded-none" style="width: 16%;"></div>
                <div class="h-2 bg-yellow-600 border border-black border-l-0 border-r-0 rounded-none" style="width: 16%;"></div>
                <div class="h-2 bg-red-300 rounded-full border border-black border-l-0 rounded-l-none" style="width: 17%;"></div>
              </div>
              <div>
                Autres lignes
              </div>


            </div>
          </div>

          <div v-if="layerDisplayed==4">
            <div class="grid grid-cols-[64px_1fr] gap-x-4">
              <div class="col-span-2 font-bold text-center">
                <hr class="mb-1 border-gray-500">
                Famille d'aménagements
                <hr class="mb-1 border-gray-500">
              </div>
              <div class="my-auto rounded-md border-gray-500 border">
                <div class="h-1 bg-legend-infra-type-bidirectionnelle" />
              </div>
              <div>
                Bidirectionnelle
              </div>

              <div class="my-auto rounded-md border-gray-500 border">
                <div class="h-1 bg-legend-infra-type-bilaterale" />
              </div>
              <div>
                Bilatérale
              </div>

              <div class="my-auto rounded-md border-gray-500 border">
                <div class="h-1 bg-legend-infra-type-voie-verte" />
              </div>
              <div>
                Voie verte
              </div>

              <div class="my-auto rounded-md border-gray-500 border">
                <div class="h-1 bg-legend-infra-type-velorue" />
              </div>
              <div>
                Vélorue
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

const isExpanded = ref(false);

function reduceLegend() {
  isExpanded.value = false;
}
function expandLegend() {
  isExpanded.value = true;
}

function toggleLegend() {
  isExpanded.value = !isExpanded.value;
}

const layerDisplayed = ref(0);

function setWhichLayerIsDisplayed(newLayerDisplayed: number) {
  layerDisplayed.value = newLayerDisplayed;
}

defineExpose({
  expandLegend,
  reduceLegend,
  toggleLegend,
  setWhichLayerIsDisplayed
});
</script>

<style>
.dashed-line {
  background-image: linear-gradient(to right, transparent 50%, white 50%);
  background-position: 0 0;
  background-repeat: repeat-x;
  background-size: 10px 0.25rem;
}

.animated-opacity {
  animation: blinker 1s linear infinite;
}

.animated-opacity-slow {
  animation: blinker 5s linear infinite;
}

.myrelative {
  position:relative;
}

.myabsolute {
  position: absolute;
  top: 0px;
  left: 0px;
}

.button-corner-top-right {
  position: absolute;
  top: 5px;
  right: 5px;
}

.font-size-small {
  background-color: rgba(255, 255, 255, 0.1);
  font-size: x-small;
  position: absolute;
  top: -5px;
  left: 15px;
  animation: halfblinker 5s linear infinite;
}

@keyframes halfblinker {
  50% {
    opacity: 0.5;
  }
}

@keyframes blinker {
  50% {
    opacity: 0;
  }
}

@keyframes dash-animation {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 12px 0;
  }
}
</style>
