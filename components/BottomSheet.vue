<template>
  <!-- Panneau qui monte du bas de l'écran, par-dessus la carte (ADR 0011). On règle sa hauteur en glissant
       sa poignée, ou tout élément du contenu marqué data-bottom-sheet-handle (l'en-tête du panneau). -->
  <Transition
    enter-active-class="transition-transform duration-300 ease-in-out"
    enter-from-class="translate-y-full"
    leave-active-class="transition-transform duration-200 ease-in-out"
    leave-to-class="translate-y-full"
    @after-leave="emit('afterLeave')"
  >
    <div
      v-if="open"
      data-bottom-sheet
      class="fixed inset-x-0 bottom-0 z-40 flex flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
      :class="{ 'transition-[height] duration-200 ease-out': !isDragging }"
      :style="{ height: `${height}px` }"
      @pointerdown="startDragging"
      @pointermove="followPointer"
      @pointerup="stopDragging"
      @pointercancel="stopDragging"
    >
      <div data-bottom-sheet-handle class="flex shrink-0 cursor-grab touch-none justify-center py-2">
        <div class="h-1.5 w-12 rounded-full bg-gray-300" />
      </div>
      <div class="flex min-h-0 flex-1 flex-col">
        <slot />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { clampDraggedBottomSheetHeight, getDefaultBottomSheetHeight, releaseBottomSheet } from '~/domain/bottomSheet';

const { open } = defineProps<{ open: boolean }>();

const emit = defineEmits<{ close: []; afterLeave: [] }>();

const height = ref(getDefaultBottomSheetHeight(window.innerHeight));
const isDragging = ref(false);
let dragStartY = 0;
let dragStartHeight = 0;

// Chaque ouverture repart de mi-hauteur ; ouvert, il garde la hauteur réglée (autre tronçon, autre ligne).
watch(
  () => open,
  (isOpen) => {
    if (isOpen) {
      height.value = getDefaultBottomSheetHeight(window.innerHeight);
    }
  },
);

// Téléphone tourné en paysage : la hauteur réglée peut dépasser 90 % du nouvel écran et cacher la poignée.
function clampHeightToScreen() {
  height.value = clampDraggedBottomSheetHeight(height.value, window.innerHeight);
}
onMounted(() => window.addEventListener('resize', clampHeightToScreen));
onBeforeUnmount(() => window.removeEventListener('resize', clampHeightToScreen));

// Les événements pointer couvrent doigt et souris. La capture garde le glisser même quand le pointeur
// sort du bottom sheet ; un bouton ou un lien de l'en-tête reste cliquable.
function startDragging(event: PointerEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('[data-bottom-sheet-handle]') || target.closest('button, a')) {
    return;
  }
  isDragging.value = true;
  dragStartY = event.clientY;
  dragStartHeight = height.value;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function followPointer(event: PointerEvent) {
  if (isDragging.value) {
    height.value = clampDraggedBottomSheetHeight(dragStartHeight - (event.clientY - dragStartY), window.innerHeight);
  }
}

function stopDragging() {
  if (!isDragging.value) {
    return;
  }
  isDragging.value = false;
  const release = releaseBottomSheet(height.value, window.innerHeight);
  if (release.kind === 'closed') {
    emit('close');
  } else {
    height.value = release.height;
  }
}
</script>
