// Seuil du panneau latéral de la carte (ADR 0010), le `lg` de Tailwind. Écrit à la main plutôt
// qu'avec `@vueuse/core`, qui n'est pas une dépendance du projet.
const LARGE_SCREEN_MEDIA_QUERY = '(min-width: 1024px)';

// Faux côté serveur : la page générée ne connaît pas la taille de l'écran. Lu dès la création côté client,
// pour qu'un grand écran ne montre pas un instant le bottom sheet des petits écrans (ADR 0011).
export function useIsLargeScreen() {
  const isLargeScreen = ref(import.meta.client ? window.matchMedia(LARGE_SCREEN_MEDIA_QUERY).matches : false);
  let mediaQueryList: MediaQueryList | undefined;

  function updateIsLargeScreen() {
    isLargeScreen.value = mediaQueryList?.matches ?? false;
  }

  onMounted(() => {
    mediaQueryList = window.matchMedia(LARGE_SCREEN_MEDIA_QUERY);
    updateIsLargeScreen();
    mediaQueryList.addEventListener('change', updateIsLargeScreen);
  });

  onBeforeUnmount(() => {
    mediaQueryList?.removeEventListener('change', updateIsLargeScreen);
  });

  return isLargeScreen;
}
