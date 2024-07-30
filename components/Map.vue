<template>
  <div class="relative">
    <LegendInfo ref="legendModalComponent" />
    <FilterModal ref="filterModalComponent" @update="refreshFilters" />
    <div id="map" class="rounded-lg h-full w-full" />
    <img
      v-if="options.logo"
      class="my-0 absolute bottom-0 right-0 z-10"
      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmhVxxaZmo-qSqIqhnj5ZrGoX0lP1UChF4dw&s"
      width="75"
      height="75"
      :alt="`logo ${config.assoName}`"
    >
  </div>
</template>

<script setup lang="ts">
import { createApp, defineComponent, h, Suspense } from 'vue';
import { Map, AttributionControl, GeolocateControl, NavigationControl, Popup, type StyleSpecification, type LngLatLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import style from '@/assets/style.json';
import FilterControl from '@/maplibre/FilterControl';
import LimitsControl from '@/maplibre/LimitsControl';
import LayerControl from '@/maplibre/LayerControl';
import FullscreenControl from '@/maplibre/FullscreenControl';
import ShrinkControl from '@/maplibre/ShrinkControl';
import LineTooltip from '~/components/tooltips/LineTooltip.vue';
import CounterTooltip from '~/components/tooltips/CounterTooltip.vue';
import PerspectiveTooltip from '~/components/tooltips/PerspectiveTooltip.vue';
import { isLineStringFeature, isPolygonFeature, type Feature, type LaneStatus, type LaneType, type PolygonFeature } from '~/types';
import config from '~/config.json';
import { setDisplayedLayer } from '~/composables/useMap'

// const config = useRuntimeConfig();
// const maptilerKey = config.public.maptilerKey;

const defaultOptions = {
  logo: true,
  limits: true,
  filter: true,
  initialLayer: 0,
  geolocation: false,
  fullscreen: false,
  onFullscreenControlClick: () => { },
  shrink: false,
  onShrinkControlClick: () => { }
};

const props = defineProps<{
  features: Feature[];
  options: typeof defaultOptions;
}>();

const options = { ...defaultOptions, ...props.options };

const legendModalComponent = ref(null);
const filterModalComponent = ref(null);

const {
  loadImages,
  plotFeatures,
  fitBounds,
  toggleLimits,
} = useMap();

const statuses = ref(['planned', 'variante', 'done', 'postponed', 'variante-postponed', 'unknown', 'wip']);
const types = ref(['bidirectionnelle', 'bilaterale', 'voie-bus', 'voie-bus-elargie', 'velorue', 'voie-verte', 'bandes-cyclables', 'zone-de-rencontre', 'heterogene', 'aucun', 'inconnu','chaucidou','mixte']);
const displayLimits = ref(true);
const features = computed(() => {
  let activeLineFeatures = (props.features ?? []).filter(feature => {
    if (isLineStringFeature(feature)) {
      return statuses.value.includes(feature.properties.status) &&
        types.value.includes(feature.properties.type);
    }
    return true;
  });
  let activeLimitsFeatures = (props.features ?? []).filter(feature => displayLimits.value && isPolygonFeature(feature))
  console.debug(activeLimitsFeatures.length)
  return activeLineFeatures.concat(activeLimitsFeatures)
});


function refreshFilters({ visibleStatuses, visibleTypes }: { visibleStatuses: LaneStatus[]; visibleTypes: LaneType[] }) {
  statuses.value = visibleStatuses;
  types.value = visibleTypes;
}

function convertIntoDisplayedLayerEnum(s: string) {
  if(s === "network") {
    return DisplayedLayer.Network
  } else if (s === "quality") {
    return DisplayedLayer.Quality
  } else if (s === "type") {
    return DisplayedLayer.Type
  }
  console.assert(s + " couldn't be convert into a DisplayedLayer enum")
  return DisplayedLayer.Network
}

onMounted(() => {
  const map = new Map({
    container: 'map',
    style: style as StyleSpecification,
    // style: `https://api.maptiler.com/maps/dataviz/style.json?key=${maptilerKey}`,
    center: config.center as LngLatLike,
    zoom: config.zoom,
    attributionControl: false
  });

  const layerControl = new LayerControl(
    () => {
      if (legendModalComponent.value) {
        (legendModalComponent.value as any).toggleLegend();
      }
    },
    (s: string) => {
      let dt = convertIntoDisplayedLayerEnum(s)
      setDisplayedLayer(dt)
      if (legendModalComponent.value) {
        (legendModalComponent.value as any).setWhichLayerIsDisplayed(dt);
      }
    }, options.initialLayer
  );
  map.addControl(layerControl, 'top-left')

  map.addControl(new NavigationControl({ showCompass: false }), 'top-left');
  map.addControl(new AttributionControl({ compact: false }), 'bottom-left');
  if (options.fullscreen) {
    const fullscreenControl = new FullscreenControl({
      onClick: () => options.onFullscreenControlClick()
    });
    map.addControl(fullscreenControl, 'top-right');
  }
  if (options.geolocation) {
    map.addControl(
      new GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        // When active the map will receive updates to the device's location as it changes.
        trackUserLocation: true
      }),
      'top-right'
    );
  }
  if (options.shrink) {
    const shrinkControl = new ShrinkControl({
      onClick: () => options.onShrinkControlClick()
    });
    map.addControl(shrinkControl, 'top-right');
  }
  if (options.filter) {
    const filterControl = new FilterControl({
      onClick: () => {
        if (filterModalComponent.value) {
          (filterModalComponent.value as any).openModal();
        }
      }
    });
    map.addControl(filterControl, 'top-right');
  }
  if (options.limits) {
    const limitsControl = new LimitsControl({
      onClick: () => {
        toggleLimits()
        limitsControl.toggleBackground()
      }
    });
    map.addControl(limitsControl, 'top-right');
  }

  map.on('load', async() => {
    await loadImages({ map });
    plotFeatures({ map, updated_features: features.value, initialLayer: options.initialLayer });
    const tailwindMdBreakpoint = 768;
    if (window.innerWidth > tailwindMdBreakpoint) {
      fitBounds({ map, features: features.value });
    }
  });

  watch(
    features,
    newFeatures => {
      plotFeatures({ map, updated_features: newFeatures, initialLayer: options.initialLayer });
    }
  );

  watch(
    () => props.features,
    newFeatures => {
      plotFeatures({ map, updated_features: newFeatures, initialLayer: options.initialLayer });
    }
  );

  // must do this to avoid multiple popups
  map.on('click', e => {
    const layers = map
      .queryRenderedFeatures(e.point)
      .filter(({ layer }) => !['maptiler_planet', 'openmaptiles'].includes(layer.source));

    if (layers.length === 0) {
      return;
    }

    const isPerspectiveLayerClicked = layers.some(({ layer }) => layer.id === 'perspectives');
    const isCompteurLayerClicked = layers.some(({ layer }) => layer.id === 'compteurs');
    const isLimitsLayerClicked = layers.some(({ layer }) => layer.id === 'limits');

    if(isLimitsLayerClicked) {
      return
    } else if (isPerspectiveLayerClicked) {
      const layer = layers.find(({ layer }) => layer.id === 'perspectives');
      const feature = features.value.find(f => {
        return f.properties.type === 'perspective' &&
          f.properties.line === layer!.properties.line &&
          f.properties.imgUrl === layer!.properties.imgUrl;
      });

      new Popup({ closeButton: false, closeOnClick: true })
        .setLngLat(e.lngLat)
        .setHTML('<div id="perspective-tooltip-content"></div>')
        .addTo(map);

      // @ts-ignore:next
      const PerspectiveTooltipComponent = defineComponent(PerspectiveTooltip);
      nextTick(() => {
        // eslint-disable-next-line vue/one-component-per-file
        createApp({
          render: () => h(Suspense, null, {
            default: h(PerspectiveTooltipComponent, { feature }),
            fallback: 'Chargement...'
          })
        }).mount('#perspective-tooltip-content');
      });
    } else if (isCompteurLayerClicked) {
      const layer = layers.find(({ layer }) => layer.id === 'compteurs');
      const feature = features.value.find(f => f.properties.name === layer!.properties.name);

      new Popup({ closeButton: false, closeOnClick: true })
        .setLngLat(e.lngLat)
        .setHTML('<div id="counter-tooltip-content"></div>')
        .addTo(map);

      // @ts-ignore:next
      const CounterTooltipComponent = defineComponent(CounterTooltip);
      nextTick(() => {
        // eslint-disable-next-line vue/one-component-per-file
        createApp({
          render: () => h(Suspense, null, {
            default: h(CounterTooltipComponent, { feature }),
            fallback: 'Chargement...'
          })
        }).mount('#counter-tooltip-content');
      });
    } else {
      const { line, name } = layers[0].properties;
      // take care layers[0].geometry is truncated (to fit tile size). We need to find the full feature.
      const feature = features.value
        .filter(isLineStringFeature)
        .find(feature => feature.properties.line === line && feature.properties.name === name);
      const lines = feature!.properties.id
        ? [...new Set(layers.filter(f => f.properties.id === feature!.properties.id).map(f => f.properties.line))]
        : [feature!.properties.line];

      new Popup({ closeButton: false, closeOnClick: true })
        .setLngLat(e.lngLat)
        .setHTML('<div id="line-tooltip-content"></div>')
        .addTo(map);

      // @ts-ignore:next
      const LineTooltipComponent = defineComponent(LineTooltip);
      nextTick(() => {
        // eslint-disable-next-line vue/one-component-per-file
        createApp({
          render: () => h(Suspense, null, {
            default: h(LineTooltipComponent, { feature, lines }),
            fallback: 'Chargement...'
          })
        }).mount('#line-tooltip-content');
      });
    }
  });
});
</script>

<style>
.maplibregl-popup-content {
  @apply p-0 rounded-lg overflow-hidden;
}

.maplibregl-info {
  background-repeat: no-repeat;
  background-position: center;
  pointer-events: auto;
  background-image: url('~/maplibre/info.svg');
  background-size: 85%;
}

.maplibregl-fullscreen {
  background-repeat: no-repeat;
  background-position: center;
  pointer-events: auto;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='29' height='29' fill='%23333'%3E%3Cpath d='M24 16v5.5c0 1.75-.75 2.5-2.5 2.5H16v-1l3-1.5-4-5.5 1-1 5.5 4 1.5-3h1zM6 16l1.5 3 5.5-4 1 1-4 5.5 3 1.5v1H7.5C5.75 24 5 23.25 5 21.5V16h1zm7-11v1l-3 1.5 4 5.5-1 1-5.5-4L6 13H5V7.5C5 5.75 5.75 5 7.5 5H13zm11 2.5c0-1.75-.75-2.5-2.5-2.5H16v1l3 1.5-4 5.5 1 1 5.5-4 1.5 3h1V7.5z'/%3E%3C/svg%3E");
}

.maplibregl-filter {
  background-repeat: no-repeat;
  background-position: center;
  pointer-events: auto;
  background-image: url('~/maplibre/filter.svg');
  background-size: 85%;
}

.maplibregl-limits {
  background-repeat: no-repeat;
  background-position: center;
  pointer-events: auto;
  background-image: url('~/maplibre/3M.png');
  background-size: 85%;
}

.maplibregl-activated {
  background: #ffeeee;
}

.maplibregl-combobox {
  background-repeat: no-repeat;
  background-position: center;
  pointer-events: auto;
  background-size: 85%;
}

.maplibregl-shrink {
  background-repeat: no-repeat;
  background-position: center;
  pointer-events: auto;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='29' height='29'%3E%3Cpath d='M18.5 16c-1.75 0-2.5.75-2.5 2.5V24h1l1.5-3 5.5 4 1-1-4-5.5 3-1.5v-1h-5.5zM13 18.5c0-1.75-.75-2.5-2.5-2.5H5v1l3 1.5L4 24l1 1 5.5-4 1.5 3h1v-5.5zm3-8c0 1.75.75 2.5 2.5 2.5H24v-1l-3-1.5L25 5l-1-1-5.5 4L17 5h-1v5.5zM10.5 13c1.75 0 2.5-.75 2.5-2.5V5h-1l-1.5 3L5 4 4 5l4 5.5L5 12v1h5.5z'/%3E%3C/svg%3E");
}

.maplibregl-popup-anchor-top .maplibregl-popup-tip,
.maplibregl-popup-anchor-top-left .maplibregl-popup-tip,
.maplibregl-popup-anchor-top-right .maplibregl-popup-tip {
  border-bottom-color: transparent;
}

.maplibregl-popup-anchor-bottom .maplibregl-popup-tip,
.maplibregl-popup-anchor-bottom-left .maplibregl-popup-tip,
.maplibregl-popup-anchor-bottom-right .maplibregl-popup-tip {
  border-top-color: transparent;
}

.maplibregl-popup-anchor-left .maplibregl-popup-tip {
  border-right-color: transparent;
}

.maplibregl-popup-anchor-right .maplibregl-popup-tip {
  border-left-color: transparent;
}

.layercontrol-title {
    font-size: large;
    font-weight: 700;
}

.layercontrol {
    z-index: 1000;
    background: #fff;
    padding: 10px;
    border-radius: 7px;
    margin-left: 20px;
    margin-right: 20px;
}
</style>
