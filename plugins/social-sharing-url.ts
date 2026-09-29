import config from '~/config.json';

// og:url et twitter:url sont le lien de l'aperçu affiché quand une page est partagée sur un réseau
// social : ils doivent désigner la page partagée elle-même, pas l'accueil ni le site de l'association.
export default defineNuxtPlugin(() => {
  const route = useRoute();
  const sharedPageUrl = computed(() => `${config.siteUrl}${route.path}`);

  useHead({
    meta: [
      { property: 'og:url', content: sharedPageUrl },
      { name: 'twitter:url', content: sharedPageUrl },
    ],
  });
});
