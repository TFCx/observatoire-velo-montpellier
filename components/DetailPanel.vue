<template>
  <aside
    ref="scrollContainer"
    aria-label="Détail du tronçon"
    class="h-full w-[600px] shrink-0 overflow-y-auto border-l border-gray-200 bg-white"
    @wheel.passive="hasUserScrolled = true"
    @touchmove.passive="hasUserScrolled = true"
  >
    <div ref="header" class="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2">
      <h2 class="text-lg font-medium leading-6 text-gray-900">{{ getRevName('singular') }}</h2>
      <!-- Un tronçon partagé : une pastille par Véloligne pour passer de l'une à l'autre (ADR 0010). -->
      <button
        v-for="sectionLine in lines"
        :key="sectionLine"
        type="button"
        class="px-3 py-0.5 rounded-full text-white font-bold border-2"
        :class="sectionLine === line ? 'border-gray-900' : 'border-transparent opacity-60 hover:opacity-100'"
        :style="`background-color: ${getLineColor(sectionLine)}`"
        :aria-pressed="sectionLine === line"
        :disabled="lines.length === 1"
        @click="emit('selectLine', sectionLine)"
      >
        {{ sectionLine }}
      </button>
      <div class="ml-auto flex items-center gap-1">
        <NuxtLink
          :to="pagePath"
          title="Ouvrir la page de la Véloligne"
          class="rounded-md p-1 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          <Icon name="mdi:open-in-new" class="h-6 w-6" aria-hidden="true" />
          <span class="sr-only">Ouvrir la page de la Véloligne</span>
        </NuxtLink>
        <button
          type="button"
          aria-label="Fermer le détail"
          class="rounded-md p-1 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          @click="emit('close')"
        >
          <Icon name="mdi:close" class="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
    </div>
    <VoieCyclableDetails :voie="lineDetail.page" :geojson="lineDetail.geojson" :show-map="false" />
  </aside>
</template>

<script lang="ts">
import type { VoiesCyclablesGeojsonCollectionItem, VoiesCyclablesPagesCollectionItem } from '@nuxt/content';
import config from '~/config.json';

// Page d'une Véloligne et ses tracés, préchargés par la carte interactive pour ce panneau (ADR 0010) :
// le panneau s'ouvre sans requête vers la base de Nuxt Content.
export type LineDetail = {
  line: string;
  page: VoiesCyclablesPagesCollectionItem;
  geojson: VoiesCyclablesGeojsonCollectionItem;
};
</script>

<script setup lang="ts">
const { getLineColor } = useColors();
const { getRevName } = useConfig();

const { lineDetail, line, lines, anchor } = defineProps<{
  lineDetail: LineDetail;
  line: string;
  lines: string[];
  anchor: string | undefined;
}>();

const emit = defineEmits<{ close: []; selectLine: [line: string] }>();

const scrollContainer = ref<HTMLElement | null>(null);
const header = ref<HTMLElement | null>(null);
const hasUserScrolled = ref(false);

const pagePath = computed(() => `/${config.slug}-${line}${anchor ? `#${anchor}` : ''}`);

function findAnchorTarget(): Element | null {
  return anchor ? (scrollContainer.value?.querySelector(`[id="${CSS.escape(anchor)}"]`) ?? null) : null;
}

function scrollToAnchor() {
  const container = scrollContainer.value;
  if (!container) {
    return;
  }
  const target = findAnchorTarget();
  if (!target) {
    container.scrollTop = 0;
    return;
  }
  const headerHeight = header.value?.offsetHeight ?? 0;
  container.scrollTop =
    target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - headerHeight;
}

// Les images au-dessus du titre (couverture, photos) se chargent après le défilement et poussent le
// titre vers le bas : on redéfile à chaque image chargée, tant que la personne n'a pas fait défiler.
// Le contenu de la page est rendu quelques images après le panneau (ContentRenderer est asynchrone) :
// on attend que le titre de l'ancre existe, au plus une seconde, avant de défiler.
const MAXIMUM_FRAMES_TO_WAIT_FOR_ANCHOR = 60;

function waitForAnchorTarget(remainingFrames: number, onReady: () => void) {
  if (!anchor || findAnchorTarget() || remainingFrames === 0) {
    onReady();
    return;
  }
  requestAnimationFrame(() => waitForAnchorTarget(remainingFrames - 1, onReady));
}

function scrollToAnchorNowAndAfterImages() {
  hasUserScrolled.value = false;
  waitForAnchorTarget(MAXIMUM_FRAMES_TO_WAIT_FOR_ANCHOR, () => {
    scrollToAnchor();
    for (const image of scrollContainer.value?.querySelectorAll('img') ?? []) {
      if (!image.complete) {
        image.addEventListener(
          'load',
          () => {
            if (!hasUserScrolled.value) {
              scrollToAnchor();
            }
          },
          { once: true },
        );
      }
    }
  });
}

onMounted(scrollToAnchorNowAndAfterImages);
watch(() => [line, anchor], scrollToAnchorNowAndAfterImages);
</script>
