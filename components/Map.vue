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
import { Map, AttributionControl, GeolocateControl, NavigationControl, type StyleSpecification, type LngLatLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import style from '@/assets/style.json';
import FilterControl from '@/maplibre/FilterControl';
import LimitsControl from '@/maplibre/LimitsControl';
import BikeInfraControl from '@/maplibre/BikeInfraControl';
import LayerControl from '@/maplibre/LayerControl';
import FullscreenControl from '@/maplibre/FullscreenControl';
import ShrinkControl from '@/maplibre/ShrinkControl';
import { isLineStringFeature, isPolygonFeature, isSectionFeature, LaneStatus, type Feature, LaneType, LaneTypeFamily, type LineStringFeature, type PolygonFeature, type SectionFeature } from '~/types';
import config from '~/config.json';
import { setDisplayedLayer } from '~/composables/useMap'
import { sortByLine } from '~/composables//map/utils';

// const config = useRuntimeConfig();
// const maptilerKey = config.public.maptilerKey;

const defaultOptions = {
  logo: true,
  limits: true,
  bikeInfra: false,
  filter: false,
  geolocation: false,
  fullscreen: false,
  onFullscreenControlClick: () => { },
  shrink: false,
  onShrinkControlClick: () => { }
};

const props = defineProps<{
  features: Feature[];
  options: Partial<typeof defaultOptions>;
}>();

const options = { ...defaultOptions, ...props.options };

const legendModalComponent = ref(null);
const filterModalComponent = ref(null);

const {
  loadImages,
  plotFeatures,
  fitBounds,
  toggleLimits,
  toggleBikeInfra,
  handleMapClick
} = useMap();

const statuses = ref([LaneStatus.Planned, LaneStatus.Variante, LaneStatus.Done, LaneStatus.Postponed, LaneStatus.VariantePostponed, LaneStatus.Unknown, LaneStatus.Wip, LaneStatus.Tested]);
const types = ref([LaneType.Unidirectionnelle, LaneType.Bidirectionnelle, LaneType.Bilaterale, LaneType.VoieBus, LaneType.VoieBusElargie, LaneType.Velorue, LaneType.VoieVerte, LaneType.BandesCyclables, LaneType.ZoneDeRencontre, LaneType.AirePietonne, LaneType.Chaucidou, LaneType.Aucun, LaneType.Inconnu]);
const families = ref([LaneTypeFamily.Dedie, LaneTypeFamily.MixiteMotorise, LaneTypeFamily.MixitePietonne])
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

function refreshFilters({ visibleStatuses, visibleTypes, visibleTypesFamily }: { visibleStatuses: LaneStatus[]; visibleTypes: LaneType[], visibleTypesFamily: LaneTypeFamily[] }) {
  statuses.value = visibleStatuses;
  types.value = visibleTypes;
  families.value = visibleTypesFamily;
}

function convertIntoDisplayedLayerEnum(s: string) {
  if(s === "progress") {
    return DisplayedLayer.Progress
  } else if (s === "finalizedProject") {
    return DisplayedLayer.FinalizedProject
  } else if (s === "quality") {
    return DisplayedLayer.Quality
  } else if (s === "typeFamily") {
    return DisplayedLayer.TypeFamily
  } else if (s === "type") {
    return DisplayedLayer.Type
  }
  console.assert(s + " couldn't be convert into a DisplayedLayer enum")
  return DisplayedLayer.Progress
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
    }
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
  if (options.bikeInfra) {
    const bikeInfraControl = new BikeInfraControl({
      onClick: () => {
        toggleBikeInfra()
        bikeInfraControl.toggleBackground()
      }
    });
    map.addControl(bikeInfraControl, 'top-right');
  }

  map.on('load', async() => {
    await loadImages({ map });

    let lineStringFeatures = features.value.filter(isLineStringFeature).sort(sortByLine);
    let sections = regroupIntoSections(lineStringFeatures)

    plotFeatures({ map, updated_sections: sections, updated_features: features.value });
    const tailwindMdBreakpoint = 768;
    if (window.innerWidth > tailwindMdBreakpoint) {
      fitBounds({ map, features: features.value });
    }
  });

  watch(
    features,
    newFeatures => {

      let lineStringFeatures = newFeatures.filter(isLineStringFeature).sort(sortByLine);
      let sections = regroupIntoSections(lineStringFeatures)

      plotFeatures({ map, updated_sections: sections, updated_features: newFeatures });
    }
  );

  watch(
    () => props.features,
    newFeatures => {

      let lineStringFeatures = newFeatures.filter(isLineStringFeature).sort(sortByLine);
      let sections = regroupIntoSections(lineStringFeatures)

      plotFeatures({ map, updated_sections: sections, updated_features: newFeatures });
    }
  );


  map.on('click', clickEvent => {

    let lineStringFeatures = features.value.filter(isLineStringFeature).sort(sortByLine);
    let sections = regroupIntoSections(lineStringFeatures)

    handleMapClick({ map, sections: sections, features: features.value, clickEvent });
  });

  function computeTypeFamily(type: LaneType): LaneTypeFamily {
    if(type == LaneType.Bidirectionnelle || type == LaneType.Bilaterale || type == LaneType.Unidirectionnelle) {
      return LaneTypeFamily.Dedie
    } else if (type == LaneType.AirePietonne || type == LaneType.VoieVerte) {
      return LaneTypeFamily.MixitePietonne
    } else if (type == LaneType.BandesCyclables || type == LaneType.Chaucidou || type == LaneType.Velorue || type == LaneType.VoieBus || type == LaneType.VoieBusElargie || type == LaneType.ZoneDeRencontre || type == LaneType.Aucun) {
      return LaneTypeFamily.MixiteMotorise
    } else {
      console.assert(type == LaneType.Inconnu)
      return LaneTypeFamily.Dedie
      //return LaneTypeFamily.Inconnu
    }
  }

  function regroupIntoSections(features: LineStringFeature[]): SectionFeature[] {
    let sections: SectionFeature[] = []
    let sectionsWithDuplicates = []
    for(let f of features) {
      let newSection =
      {
        type: f.type,
        properties:
        {
          id: f.properties.id,
          lines: [f.properties.line],
          name: f.properties.name,
          quality: f.properties.quality,
          qualityB: f.properties.qualityB,
          status: f.properties.status,
          type: f.properties.type,
          typeB: f.properties.typeB,
          typeFamily: computeTypeFamily(f.properties.type),
          typeFamilyB: f.properties.typeB ? computeTypeFamily(f.properties.typeB) : computeTypeFamily(f.properties.type),
          doneAt: f.properties.doneAt,
        },
        geometry: f.geometry
      }
      if(f.properties.id) {
        for(let o of features) {
          if(o != f && f.properties.id == o.properties.id) {
            newSection.properties.lines.push(o.properties.line)
          }
        }
      }
      newSection.properties.lines.sort()
      sectionsWithDuplicates.push(newSection)
    }
    let treatedId: string[] = []
    for(let s of sectionsWithDuplicates) {
      if(s.properties.id && treatedId.includes(s.properties.id)) {
        continue
      }
      sections.push(s)
      if(s.properties.id) {
        treatedId.push(s.properties.id)
      }
    }
    return sections
  }
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
