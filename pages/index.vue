<template>
  <div>
    <HomeHeroSection />
    <HomeStatSection />
    <div class="max-w-7xl mx-auto mt-14 px-4 sm:px-6 lg:px-8 lg:mt-24">
      <div class="space-y-8 sm:space-y-12">
        <div class="space-y-5 sm:mx-auto sm:max-w-xl sm:space-y-4 lg:max-w-5xl text-center">
          <h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Où en est le projet ?
          </h2>
          <p class="text-xl text-gray-500">
            Grand Chambéry a inauguré le mercredi 5 juin 2024 le jalonnement (panneaux et marquages) de 9 « pistes bleues » de son réseau structurant.
            Pour l’association Roue Libre, ce réseau de 9 “pistes” ainsi que les deux liaisons Chambery - Jacob-Bellecombette et Chambéry-Mérande-Bassens-Barby doivent être considéré comme une indication des secteurs prioritaires à aménager, et la réalisation d’aménagements cyclables continus et sécurisés pour toutes et tous doit être une urgente priorité.
          </p>
        </div>
      </div>
      <ProgressBar :voies="voies" class="mt-8 md:mt-10" />
      <Stats :voies="voies" class="mt-8" />
          </div>
    <div class="max-w-7xl mx-auto mt-14 px-4 sm:px-6 lg:px-8 lg:mt-24">
      <div class="space-y-8 sm:space-y-12">
        <div class="space-y-5 sm:mx-auto sm:max-w-xl sm:space-y-4 lg:max-w-5xl text-center">
          <h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Caractéristiques actuelles du futur réseau à Haut Niveau de Service
          </h2>
        </div>
      </div>
      <Typology :voies="voies" class="mt-8 max-w-2xl mx-auto" />
    </div>
    <div class="max-w-7xl mx-auto mt-14 px-4 sm:px-6 lg:px-8 lg:mt-24">
      <div class="space-y-8 sm:space-y-12">
        <div class="space-y-5 sm:mx-auto sm:max-w-xl sm:space-y-4 lg:max-w-5xl text-center">
          <h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Avancement par ligne
          </h2>
          <p class="text-xl text-gray-500">
            Choisissez une {{ getRevName('singular') }} pour la découvrir et voir son niveau d'avancement.
          </p>
        </div>
        <HomeLinesSection class="mt-5" />
      </div>
    </div>
    <div class="py-16">
      <LvvCta />
    </div>
  </div>
</template>

<script setup>
const { getRevName } = useConfig();

const { data: voies } = await useAsyncData(() => {
  return queryContent('voies-cyclables').where({ _type: 'json' }).find();
});
</script>
