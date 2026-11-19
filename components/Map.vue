<template>
  <!-- min-h-0 : une page de Véloligne dans le panneau de détail (9 000 px) empêcherait sinon la carte de
       rétrécir à la hauteur disponible, sous l'en-tête du site. -->
  <div class="relative min-h-0">
    <LegendInfo ref="legendModalComponent" :default-legend="options.defaultLayer" />
    <FilterModal ref="filterModalComponent" :filters="filters" />
    <div class="flex h-full w-full">
      <div class="relative h-full min-w-0 flex-1">
        <!-- data-selected-section : le tronçon passé à la couche de mise en évidence, lu par les tests
             navigateur, le rendu de la carte variant d'une capture à l'autre. -->
        <div id="map" class="rounded-lg h-full w-full" :data-selected-section="highlightedSectionName ?? undefined" />
        <img
          v-if="options.logo"
          class="my-0 absolute bottom-0 right-0 z-10"
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmhVxxaZmo-qSqIqhnj5ZrGoX0lP1UChF4dw&s"
          width="75"
          height="75"
          :alt="`logo ${config.assoName}`"
        />
      </div>
      <FilterPanel v-if="isFilterPanelShown" :filters="filters" @close="setMapPanel({ kind: 'closed' })" />
      <DetailPanel
        v-if="detailPanel"
        :line-detail="detailPanel.lineDetail"
        :section-name="detailPanel.sectionName"
        :line="detailPanel.line"
        :lines="detailPanel.lines"
        :anchor="detailPanel.anchor"
        @close="setMapPanel({ kind: 'closed' })"
        @select-line="(line) => setMapPanel({ kind: 'detail', sectionName: detailPanel!.sectionName, line })"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Map,
  AttributionControl,
  GeolocateControl,
  NavigationControl,
  setWorkerUrl,
  type StyleSpecification,
  type LngLatLike,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// MapLibre 6 charge son worker par une URL relative que Vite ne sait pas résoudre : on lui fournit
// l'URL du worker construit par Vite (`?worker&url` et non `?url`, qui oublierait ses imports).
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import style from '@/assets/style.json';
import LegendInfo from '@/components/LegendInfo.vue';
import FilterModal from '@/components/FilterModal.vue';
import FilterPanel from '~/components/FilterPanel.vue';
import DetailPanel, { type LineDetail } from '~/components/DetailPanel.vue';
import FilterControl from '@/maplibre/FilterControl';
import LimitsControl from '@/maplibre/LimitsControl';
import LayerControl from '@/maplibre/LayerControl';
import FullscreenControl from '@/maplibre/FullscreenControl';
import ShrinkControl from '@/maplibre/ShrinkControl';
import { getProgressCategory } from '~/domain/progress';
import { isLineStringFeature, isPolygonFeature, type Feature, type SectionFeature } from '~/types';
import config from '~/config.json';
import { regroupIntoSections } from '~/domain/sections';
import {
  convertMapPanelToQuery,
  findLinkAnchor,
  findSectionLink,
  parseMapPanel,
  type MapPanel,
} from '~/domain/mapPanel';
import { setDisplayedLayer } from '~/composables/useMap';
import { fitSectionBounds, sortByLine } from '~/composables//map/utils';

// const config = useRuntimeConfig();
// const maptilerKey = config.public.maptilerKey;

const defaultOptions = {
  defaultLayer: DisplayedLayer.Progress,
  logo: true,
  limits: true,
  displayLayerType: false,
  filter: true,
  geolocation: false,
  fullscreen: false,
  onFullscreenControlClick: () => {},
  shrink: false,
  onShrinkControlClick: () => {},
  // Panneau latéral piloté par l'URL, pour la seule carte interactive (ADR 0010) : les cartes
  // intégrées dans une autre page n'ont pas à lire ni changer l'URL de cette page.
  sidePanel: false,
};

const props = defineProps<{
  features: Feature[];
  options?: Partial<typeof defaultOptions>;
  // Pages des Vélolignes affichées par le panneau de détail ; seule la carte interactive les fournit.
  lineDetails?: LineDetail[];
}>();

const options = { ...defaultOptions, ...props.options };

const legendModalComponent = ref<InstanceType<typeof LegendInfo> | null>(null);
const filterModalComponent = ref<InstanceType<typeof FilterModal> | null>(null);

const {
  loadImages,
  updateOrCreateSources,
  separateSectionsIntoLanes,
  plotEverything,
  fitBounds,
  toggleLimits,
  handleMapClick,
  handleMapHover,
  removeHoverTooltip,
  highlightSelectedSection,
} = useMap();

const filters = useMapFilters();

const route = useRoute();
const router = useRouter();
const isLargeScreen = useIsLargeScreen();
// Tous les tronçons, filtrés ou non : un lien vers un tronçon masqué par les filtres reste valide.
const allSections = computed(() =>
  regroupIntoSections((props.features ?? []).filter(isLineStringFeature).sort(sortByLine)),
);
const mapPanel = computed<MapPanel>(() =>
  options.sidePanel
    ? parseMapPanel(
        route.query,
        allSections.value.map((section) => section.properties),
      )
    : { kind: 'closed' },
);
const isFilterPanelShown = computed(() => isLargeScreen.value && mapPanel.value.kind === 'filters');

// Tout ce que le panneau de détail affiche ; null quand il est fermé, ou sans page pour la Véloligne.
const detailPanel = computed(() => {
  const panel = mapPanel.value;
  if (!isLargeScreen.value || panel.kind !== 'detail') {
    return null;
  }
  const section = allSections.value.find((candidate) => candidate.properties.name === panel.sectionName);
  const lineDetail = props.lineDetails?.find((candidate) => candidate.line === panel.line);
  if (!section || !lineDetail) {
    return null;
  }
  const link = findSectionLink(props.features.filter(isLineStringFeature), panel.sectionName, panel.line);
  return {
    sectionName: panel.sectionName,
    line: panel.line,
    lines: section.properties.lines,
    lineDetail,
    anchor: link ? findLinkAnchor(link) : undefined,
  };
});

// Tronçon effectivement mis en évidence sur la carte : null avant le dessin des couches.
const highlightedSectionName = ref<string | null>(null);

function openSectionDetail(section: SectionFeature) {
  const firstLine = section.properties.lines[0];
  if (firstLine !== undefined) {
    setMapPanel({ kind: 'detail', sectionName: section.properties.name, line: firstLine });
  }
}

function setMapPanel(panel: MapPanel) {
  router.replace({ query: convertMapPanelToQuery(panel, route.query) });
}

// En grand écran, la carte interactive montre les filtres dans le panneau : une modale ouverte avant
// d'agrandir la fenêtre y passe, pour ne pas afficher les filtres deux fois.
watch(isLargeScreen, (isNowLargeScreen) => {
  if (isNowLargeScreen && options.sidePanel && filterModalComponent.value?.isOpen) {
    filterModalComponent.value.closeModal();
    setMapPanel({ kind: 'filters' });
  }
});

function toggleFilters() {
  if (options.sidePanel && isLargeScreen.value) {
    setMapPanel(mapPanel.value.kind === 'filters' ? { kind: 'closed' } : { kind: 'filters' });
  } else {
    filterModalComponent.value?.openModal();
  }
}
const displayLimits = ref(true);
const features = computed(() => {
  const activeLineFeatures = (props.features ?? []).filter((feature) => {
    if (isLineStringFeature(feature)) {
      return (
        filters.visibleProgressCategories.value.includes(getProgressCategory(feature.properties)) &&
        filters.visibleTypes.value.includes(feature.properties.type)
      );
    }
    return true;
  });
  const activeLimitsFeatures = (props.features ?? []).filter(
    (feature) => displayLimits.value && isPolygonFeature(feature),
  );
  return activeLineFeatures.concat(activeLimitsFeatures);
});

function convertIntoDisplayedLayerEnum(s: string) {
  if (s === 'progress') {
    return DisplayedLayer.Progress;
  } else if (s === 'finalizedProject') {
    return DisplayedLayer.FinalizedProject;
  } else if (s === 'quality') {
    return DisplayedLayer.Quality;
  } else if (s === 'typeFamily') {
    return DisplayedLayer.TypeFamily;
  } else if (s === 'type') {
    return DisplayedLayer.Type;
  }
  console.warn(`"${s}" ne correspond à aucun DisplayedLayer : repli sur l'affichage de l'avancement`);
  return DisplayedLayer.Progress;
}

onMounted(() => {
  setWorkerUrl(maplibreWorkerUrl);
  const map = new Map({
    container: 'map',
    // Le JSON importé est typé au plus près de son contenu, pas selon la spécification MapLibre.
    style: style as unknown as StyleSpecification,
    // style: `https://api.maptiler.com/maps/dataviz/style.json?key=${maptilerKey}`,
    center: config.center as LngLatLike,
    zoom: config.zoom,
    attributionControl: false,
  });

  const layerControl = new LayerControl(
    options.defaultLayer,
    options.displayLayerType,
    () => {
      if (legendModalComponent.value) {
        legendModalComponent.value.toggleLegend();
      }
    },
    (s: string) => {
      const dt = convertIntoDisplayedLayerEnum(s);
      setDisplayedLayer(dt);
      if (legendModalComponent.value) {
        legendModalComponent.value.setWhichLayerIsDisplayed(dt);
      }
    },
  );
  map.addControl(layerControl, 'top-left');

  map.addControl(new NavigationControl({ showCompass: false }), 'top-left');
  map.addControl(new AttributionControl({ compact: false }), 'bottom-left');
  if (options.fullscreen) {
    const fullscreenControl = new FullscreenControl({
      onClick: () => options.onFullscreenControlClick(),
    });
    map.addControl(fullscreenControl, 'top-right');
  }
  if (options.geolocation) {
    map.addControl(
      new GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        // When active the map will receive updates to the device's location as it changes.
        trackUserLocation: true,
      }),
      'top-right',
    );
  }
  if (options.shrink) {
    const shrinkControl = new ShrinkControl({
      onClick: () => options.onShrinkControlClick(),
    });
    map.addControl(shrinkControl, 'top-right');
  }
  if (options.filter) {
    const filterControl = new FilterControl({ onClick: toggleFilters });
    map.addControl(filterControl, 'top-right');
  }
  if (options.limits) {
    const limitsControl = new LimitsControl({
      onClick: () => {
        toggleLimits();
        limitsControl.toggleBackground();
      },
    });
    map.addControl(limitsControl, 'top-right');
  }
  setDisplayedLayer(options.defaultLayer);

  map.on('load', async () => {
    await loadImages({ map });

    const lineStringFeatures = features.value.filter(isLineStringFeature).sort(sortByLine);
    const sections = regroupIntoSections(lineStringFeatures);

    plotEverything(map, sections, features.value);
    const tailwindMdBreakpoint = 768;
    // Un lien vers un tronçon cadre la carte sur ce tronçon (applySelectedSection), pas sur le réseau.
    if (window.innerWidth > tailwindMdBreakpoint && !detailPanel.value) {
      fitBounds({ map, features: features.value });
    }
    applySelectedSection();
  });

  // Met en évidence le tronçon du panneau de détail et cadre la carte sur lui ; data-selected-section
  // n'est mis à jour qu'une fois les deux faits.
  function applySelectedSection() {
    const sectionName = detailPanel.value?.sectionName;
    const section = allSections.value.find((candidate) => candidate.properties.name === sectionName) ?? null;
    if (!highlightSelectedSection(map, section)) {
      return;
    }
    if (section) {
      fitSectionBounds(map, section);
    }
    highlightedSectionName.value = section?.properties.name ?? null;
  }
  watch(() => detailPanel.value?.sectionName, applySelectedSection);

  // When filters change
  watch(features, (newFeatures) => {
    const lineStringFeatures = newFeatures.filter(isLineStringFeature).sort(sortByLine);
    const sections = regroupIntoSections(lineStringFeatures);
    const lanes = separateSectionsIntoLanes(sections);

    updateOrCreateSources(map, sections, lanes);
  });

  // When evolution change
  watch(
    () => props.features,
    (newFeatures) => {
      const lineStringFeatures = newFeatures.filter(isLineStringFeature).sort(sortByLine);
      const sections = regroupIntoSections(lineStringFeatures);
      const lanes = separateSectionsIntoLanes(sections);

      updateOrCreateSources(map, sections, lanes);
    },
  );

  // Calculés une fois par changement de données ou de filtres, pas à chaque mouvement de souris.
  const displayedSections = computed(() =>
    regroupIntoSections(features.value.filter(isLineStringFeature).sort(sortByLine)),
  );
  map.on('mousemove', (hoverEvent) => {
    handleMapHover({ map, sections: displayedSections.value, hoverEvent });
  });
  map.on('mouseout', () => removeHoverTooltip());

  map.on('click', (clickEvent) => {
    const lineStringFeatures = features.value.filter(isLineStringFeature).sort(sortByLine);
    const sections = regroupIntoSections(lineStringFeatures);

    handleMapClick({
      map,
      sections: sections,
      features: features.value,
      clickEvent,
      openSectionDetail: options.sidePanel && isLargeScreen.value ? openSectionDetail : undefined,
    });
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
