import config from '~/config.json';

// Image affichée quand la page est partagée sur un réseau social. Sans image propre à la page, on ne
// déclare rien : l'image par défaut du site (nuxt.config.ts) s'applique, au lieu d'être écrasée par
// une balise vide.
export function useShareImage(imagePath: string | undefined) {
  if (!imagePath) {
    return;
  }
  // Les réseaux sociaux ignorent une image donnée par un chemin relatif (/image.jpg).
  const imageUrl = imagePath.startsWith('/') ? `${config.siteUrl}${imagePath}` : imagePath;
  useHead({
    meta: [
      { property: 'og:image', content: imageUrl },
      { name: 'twitter:image', content: imageUrl },
      // Les dimensions déclarées par défaut sont celles de l'image du site, pas de celle-ci.
      { property: 'og:image:width', content: undefined },
      { property: 'og:image:height', content: undefined },
    ],
  });
}
