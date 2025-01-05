<template>
  <div class="bg-white pt-12 sm:pt-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Les {{ getRevName() }}, c'est quoi ?
        </h2>
        <p class="mt-3 text-xl text-gray-500 sm:mt-4">
          C'est le nom du projet de réseau structurant lancé en 2024 par la Communauté d'agglomération de Grand Chambéry.
          <br> Concrètement, pour les usagers, une {{ getRevName('singular') }} doit être une voie cyclable large (3 à 4m), sécurisée, efficace, attractive et confortable, souvent sous forme de piste bidirectionnelle et séparée du trafic routier. L'ensemble doit créer un maillage cyclable sans discontinuités qui connecte l'ensemble des villes de l'agglomération de Grand Chambéry.
        </p>
      </div>
    </div>
    <div class="mt-10 bg-white">
      <div class="relative">
        <div class="absolute inset-0 h-1/2 bg-white" />
        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="max-w-4xl mx-auto">
            <dl class="rounded-lg bg-white shadow-lg sm:grid sm:grid-cols-3">
              <div class="flex flex-col border-b border-gray-100 p-6 text-center sm:border-0 sm:border-r">
                <dt class="order-2 mt-2 text-lg leading-6 font-medium text-gray-500">
                  Lignes
                </dt>
                <dd class="order-1 text-5xl font-extrabold text-lvv-blue-600">
                  11
                </dd>
              </div>
              <div class="flex flex-col border-t border-b border-gray-100 p-6 text-center sm:border-0 sm:border-l sm:border-r">
                <dt class="order-2 mt-2 text-lg leading-6 font-medium text-gray-500">
                  Distance
                </dt>
                <dd class="order-1 text-5xl font-extrabold text-lvv-blue-600">
                  59km
                </dd>
              </div>
              <div class="flex flex-col border-t border-gray-100 p-6 text-center sm:border-0 sm:border-l">
                <dt class="order-2 mt-2 text-lg leading-6 font-medium text-gray-500">
                  Budget
                </dt>
                <dd class="order-1 text-5xl font-extrabold text-lvv-blue-600">
                  Inconnu
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getRevName } = useConfig();
</script>
