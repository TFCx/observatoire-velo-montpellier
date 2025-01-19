<template>
  <footer class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl bg-white border-t border-gray-200">
    <div class="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
      <nav class="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
        <div v-for="item in links" :key="item.name" class="px-5 py-2">
          <NuxtLink :to="item.path" class="text-base text-gray-500 hover:text-gray-900">
            {{ item.name }}
          </NuxtLink>
        </div>
      </nav>
      <div class="mt-4 border-t border-gray-200 pt-4 md:flex md:items-center md:justify-between">
        <div class="flex justify-center space-x-6 md:order-2">
          <a v-for="item in socials" :key="item.name" :href="item.href" target="_blank" class="text-gray-500 hover:text-gray-500">
            <span class="sr-only">{{ item.name }}</span>
            <Icon :name="item.icon" class="h-6 w-6" aria-hidden="true" />
          </a>
        </div>
        <div class="mt-8 md:mt-0 md:order-1">
          <p class="text-center text-base text-gray-500">
            {{ getAssoName() }}
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const { getAssoName } = useConfig();

const links = [
  { name: 'Méthodologie', path: '/blog/methodo' },
  { name: 'Mentions légales', path: '/mentions-legales' },
  { name: 'Historique', path: '/historique' },
  { name: 'Réseau Cyclable à Haut Niveau de Service', path: '/blog/reseauchns' }
];

const socials = {
  cyclopolis: [
    {
      name: 'Github',
      href: 'https://github.com/benoitdemaegdt/voieslyonnaises',
      icon: 'mdi:github'
    },
    {
      name: 'LinkedIn',
      href: 'https://www.linkedin.com/in/benoitdemaegdt',
      icon: 'mdi:linkedin'
    }
  ],
  lvv: [
    {
      name: 'Mastodon',
      href: 'https://masto.bike/deck/@RoueLibreSavoie',
      icon: 'mdi:mastodon'
    },
    {
      name: 'Facebook',
      href: 'https://www.facebook.com/RoueLibreSavoie/',
      icon: 'mdi:facebook'
    },
    {
      name: 'Site web',
      href: 'https://rouelibre.net',
      icon: 'mdi:link'
    },
    {
      name: 'Email',
      href: 'mailto:contact_at_rouelibre.net',
      icon: 'mdi:email-outline'
    }
  ]
};
</script>
