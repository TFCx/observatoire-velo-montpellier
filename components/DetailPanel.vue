<template>
  <aside
    ref="scrollContainer"
    aria-label="Détail du tronçon"
    class="overflow-y-auto bg-white"
    :class="display === 'side-panel' ? 'h-full w-[600px] shrink-0 border-l border-gray-200' : 'min-h-0 flex-1'"
    @scroll.passive="detectUserScroll"
  >
    <!-- data-bottom-sheet-handle : dans le bottom sheet, l'en-tête sert aussi à régler sa hauteur. -->
    <div
      ref="header"
      data-bottom-sheet-handle
      class="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2"
      :class="{ 'touch-none': display === 'bottom-sheet' }"
    >
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
    <div ref="content" class="relative">
      <VoieCyclableDetails :voie="lineDetail.page" :geojson="lineDetail.geojson" :show-map="false" />
      <!-- La clé relance le flash à chaque tronçon sélectionné, même si sa section est déjà surlignée. -->
      <div
        v-if="highlightBox"
        :key="highlightFlashCount"
        class="section-highlight pointer-events-none absolute z-10"
        :style="{
          top: `${highlightBox.top}px`,
          left: `${highlightBox.left}px`,
          width: `${highlightBox.width}px`,
          height: `${highlightBox.height}px`,
        }"
      />
    </div>
  </aside>
</template>

<script lang="ts">
import type { VoiesCyclablesGeojsonCollectionItem, VoiesCyclablesPagesCollectionItem } from '@nuxt/content';
import config from '~/config.json';
import type { PanelDisplay } from '~/domain/bottomSheet';

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

const { lineDetail, sectionName, line, lines, anchor, display } = defineProps<{
  display: PanelDisplay;
  lineDetail: LineDetail;
  sectionName: string;
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
    scrollTopSetByPanel = 0;
    return;
  }
  const headerHeight = header.value?.offsetHeight ?? 0;
  container.scrollTop =
    target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - headerHeight;
  scrollTopSetByPanel = container.scrollTop;
}

// Molette, doigt, barre de défilement ou clavier : tout défilement qui ne vient pas de scrollToAnchor
// est celui de la personne, et le panneau cesse de la ramener à l'ancre. Le navigateur arrondit
// scrollTop : on tolère quelques pixels d'écart.
let scrollTopSetByPanel: number | undefined;
const SCROLL_TOLERANCE_PX = 2;

function detectUserScroll() {
  const container = scrollContainer.value;
  if (
    container &&
    (scrollTopSetByPanel === undefined || Math.abs(container.scrollTop - scrollTopSetByPanel) > SCROLL_TOLERANCE_PX)
  ) {
    hasUserScrolled.value = true;
  }
}

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

// Section du texte d'un tronçon : son titre et ce qui suit, jusqu'au titre suivant de même niveau ou
// de niveau supérieur. Surlignée parce qu'un titre en fin de page ne peut pas monter en haut du panneau.
type HighlightBox = { top: number; left: number; width: number; height: number };
const HIGHLIGHT_MARGIN = 8;
const highlightBox = ref<HighlightBox | null>(null);
const highlightFlashCount = ref(0);

function readHeadingLevel(element: Element): number | undefined {
  const headingMatch = /^H([1-6])$/.exec(element.tagName);
  return headingMatch ? Number(headingMatch[1]) : undefined;
}

function findSectionElements(title: Element): Element[] {
  const titleLevel = readHeadingLevel(title) ?? 6;
  const sectionElements = [title];
  for (let sibling = title.nextElementSibling; sibling; sibling = sibling.nextElementSibling) {
    const siblingLevel = readHeadingLevel(sibling);
    if (siblingLevel !== undefined && siblingLevel <= titleLevel) {
      break;
    }
    sectionElements.push(sibling);
  }
  return sectionElements;
}

function updateHighlight() {
  const contentElement = content.value;
  const title = findAnchorTarget();
  if (!contentElement || !title) {
    highlightBox.value = null;
    return;
  }
  const origin = contentElement.getBoundingClientRect();
  const boxes = findSectionElements(title).map((element) => element.getBoundingClientRect());
  const top = Math.min(...boxes.map((box) => box.top)) - origin.top - HIGHLIGHT_MARGIN;
  const bottom = Math.max(...boxes.map((box) => box.bottom)) - origin.top + HIGHLIGHT_MARGIN;
  const left = Math.min(...boxes.map((box) => box.left)) - origin.left - HIGHLIGHT_MARGIN;
  const right = Math.max(...boxes.map((box) => box.right)) - origin.left + HIGHLIGHT_MARGIN;
  highlightBox.value = { top, left, width: right - left, height: bottom - top };
}

function scrollToAnchorOnceRendered() {
  hasUserScrolled.value = false;
  scrollTopSetByPanel = undefined;
  highlightFlashCount.value += 1;
  waitForAnchorTarget(MAXIMUM_FRAMES_TO_WAIT_FOR_ANCHOR, () => {
    if (!hasUserScrolled.value) {
      scrollToAnchor();
    }
    updateHighlight();
  });
}

// Images et polices chargées après le défilement changent la hauteur du contenu et décalent le titre :
// on redéfile à chaque changement, tant que la personne n'a pas fait défiler elle-même.
const content = ref<HTMLElement | null>(null);
let contentResizeObserver: ResizeObserver | undefined;

onMounted(() => {
  scrollToAnchorOnceRendered();
  contentResizeObserver = new ResizeObserver(() => {
    if (!hasUserScrolled.value) {
      scrollToAnchor();
    }
    updateHighlight();
  });
  if (content.value) {
    contentResizeObserver.observe(content.value);
  }
});
onBeforeUnmount(() => contentResizeObserver?.disconnect());
watch(() => [sectionName, line, anchor], scrollToAnchorOnceRendered);
</script>

<style scoped>
/* Jaune de l'observatoire ; multiply garde le texte lisible sous le surlignage. */
.section-highlight {
  background-color: rgb(255 220 78 / 0.18);
  border-radius: 0.5rem;
  mix-blend-mode: multiply;
  animation: section-highlight-flash 2s ease-out;
}

@keyframes section-highlight-flash {
  from {
    background-color: rgb(255 220 78 / 0.5);
  }
  to {
    background-color: rgb(255 220 78 / 0.18);
  }
}

@media (prefers-reduced-motion: reduce) {
  .section-highlight {
    animation: none;
  }
}
</style>
