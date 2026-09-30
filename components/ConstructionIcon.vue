<template>
  <!-- Même panneau que le long des tronçons en travaux sur la carte : le texte renvoie au dessin. -->
  <svg
    class="construction-icon inline-block h-[1.2em] w-[1.2em] align-[-0.25em]"
    :viewBox="`0 0 ${CONSTRUCTION_ICON_VIEWBOX_SIZE} ${CONSTRUCTION_ICON_VIEWBOX_SIZE}`"
    :stroke="CONSTRUCTION_ICON_STROKE"
    :stroke-width="CONSTRUCTION_ICON_STROKE_WIDTH"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <rect
      :x="CONSTRUCTION_ICON_BARRIER.x"
      :y="CONSTRUCTION_ICON_BARRIER.y"
      :width="CONSTRUCTION_ICON_BARRIER.width"
      :height="CONSTRUCTION_ICON_BARRIER.height"
      :rx="CONSTRUCTION_ICON_BARRIER.radius"
      :fill="CONSTRUCTION_ICON_FILL"
    />
    <line
      v-for="([[startX, startY], [endX, endY]], index) in CONSTRUCTION_ICON_SEGMENTS"
      :key="index"
      :x1="startX"
      :y1="startY"
      :x2="endX"
      :y2="endY"
    />
  </svg>
</template>

<script setup lang="ts">
import {
  CONSTRUCTION_ICON_BARRIER,
  CONSTRUCTION_ICON_FILL,
  CONSTRUCTION_ICON_SEGMENTS,
  CONSTRUCTION_ICON_STROKE,
  CONSTRUCTION_ICON_STROKE_WIDTH,
  CONSTRUCTION_ICON_VIEWBOX_SIZE,
} from '~/composables/map/constructionIcon';
</script>
