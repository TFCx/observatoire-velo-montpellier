import { Map, Popup } from 'maplibre-gl';
import { createApp, defineComponent, h, Suspense } from 'vue';
import type { CounterParsedContent } from '../types/counters';
import { isLineStringFeature, type Feature, type LaneFeature, type LineStringFeature, type CompteurFeature, type PerspectiveFeature, type SectionFeature, type MultiColoredLineStringFeature, isSectionFeature, type DangerFeature} from '~/types';
import { ref } from 'vue';

import { drawCurrentNetwork, drawFinishedNetwork, drawQualityNetwork, drawTypeNetwork, drawTypeFamilyNetwork, changeLayer, addListnersForHovering } from "./map/network";
import { plotPerspective, plotCompteurs, plotDangers, plotLimits, plotPumps, plotBaseBikeInfrastructure } from "./map/features";

// Tooltips
import PerspectiveTooltip from '~/components/tooltips/PerspectiveTooltip.vue';
import CounterTooltip from '~/components/tooltips/CounterTooltip.vue';
import DangerTooltip from '~/components/tooltips/DangerTooltip.vue';
import LineTooltip from '~/components/tooltips/LineTooltip.vue';
import { getCrossIconUrl, sortByLine, fitBounds, upsertMapSource } from './map/utils';

enum DisplayedLayer {
  Progress = 0,
  Quality = 1,
  TypeFamily = 2,
  FinalizedProject = 3,
  Type = 4
}

const displayedLayer = ref(DisplayedLayer.Progress);



const setDisplayedLayer = (value: DisplayedLayer) => {
  displayedLayer.value = value;
};

export { DisplayedLayer, setDisplayedLayer };


let displayLimits = ref(false)

let displayBikeInfra = ref(false)


function toggleLimits() {
  displayLimits.value = !displayLimits.value
}

function toggleBikeInfra() {
  displayBikeInfra.value = !displayBikeInfra.value
}

function toggleLimitsVisibility(map: Map, displayLimits: boolean) {
  map.setLayoutProperty("limits", "visibility", displayLimits ? "visible" : "none")
}

function toggleBikeInfraVisibility(map: Map, displayBikeInfra: boolean) {
  map.setLayoutProperty("layer-underline-base-infrastructure", "visibility", displayBikeInfra ? "visible" : "none")
}


export const useMap = () => {

  function plotEverything({ map, updated_sections, updated_features }: { map: Map; updated_sections?: SectionFeature[], updated_features?: Feature[] }) {
    //plotBaseBikeInfrastructure(map)

    if(updated_sections) {
      let lanes = separateSectionsIntoLanes(updated_sections)

      plotNetwork(map, updated_sections, lanes);
      // setLanesColor(map, displayedLayer.value)
      // watch(displayedLayer, (displayedLayer) => setLanesColor(map, displayedLayer))
    }
    if(updated_features) {

      plotFeatures({map, updated_features})
    }
  }

  function plotNetwork(map: Map, sections: SectionFeature[], lanes: LaneFeature[]) {
    const lanesWithId = lanes.map((feature, index) => ({ id: index, ...feature }));

    if (lanesWithId.length === 0 && !map.getLayer('highlight')) {
      return;
    }

    drawFinishedNetwork(map, sections, lanesWithId)

    drawCurrentNetwork(map, sections, lanesWithId)

    drawQualityNetwork(map, sections, lanesWithId)

    drawTypeFamilyNetwork(map, sections, lanesWithId)

    drawTypeNetwork(map, sections, lanesWithId)

    addListnersForHovering(map);
  }

  function plotFeatures({ map, updated_features }: { map: Map; updated_features: Feature[] }) {

    plotPerspective({ map, features: updated_features });
    plotCompteurs({ map, features: updated_features });
    plotPumps({ map, features: updated_features });
    plotDangers({ map, features: updated_features });
    plotLimits({ map, features: updated_features });

    changeLayer(map, DisplayedLayer.Progress)

    watch(displayLimits, (displayLimits) => toggleLimitsVisibility(map, displayLimits))
    watch(displayBikeInfra, (displayBikeInfra) => toggleBikeInfraVisibility(map, displayBikeInfra))
    watch(displayedLayer, (displayedLayer) => changeLayer(map, displayedLayer))
  }


  function getCompteursFeatures({
    counters,
    type
  }: {
    counters: CounterParsedContent[] | null;
    type: 'compteur-velo' | 'compteur-voiture';
  }): CompteurFeature[] {
    if (!counters) { return []; }
    if (counters.length === 0) { return []; }

    return counters.map(counter => ({
      type: 'Feature',
      properties: {
        type,
        name: counter.name,
        link: counter._path,
        counts: counter.counts
      },
      geometry: {
        type: 'Point',
        coordinates: [counter.coordinates[0], counter.coordinates[1]]
      }
    }));
  }

  function separateSectionsIntoLanes(features: SectionFeature[]): LaneFeature[] {
    let lanes: LaneFeature[] = []
    features.forEach(f => {
      f.properties.lines.forEach((lineNo, index) => {
        let lane: LaneFeature = {
          type: f.type,
          properties: {
            line: lineNo,
            name: f.properties.name,
            lane_index: index,
            nb_lanes: f.properties.lines.length,
            color: getLineColor(lineNo),
            status: f.properties.status,
            quality: f.properties.quality,
            qualityB: f.properties.qualityB,
            type: f.properties.type,
            typeB: f.properties.typeB,
            typeFamily: f.properties.typeFamily,
            typeFamilyB: f.properties.typeFamilyB,
            doneAt: f.properties.doneAt,
          },
          geometry: f.geometry
        }

        lanes.push(lane)
      })
    })
    return lanes
  }

  const { getLineColor } = useColors();

  function ensure<T>(argument: T | undefined | null, message: string = 'This value was promised to be there.'): T {
    if (argument === undefined || argument === null) {
      throw new TypeError(message);
    }

    return argument;
  }

  function handleMapClick({ map, sections, features, clickEvent }: { map: Map; sections: SectionFeature[], features: Feature[]; clickEvent: any }) {
    const layers = [
      {
        id: 'linestring', // not really a layer id. gather all linestrings.
        isClicked: () => {
          const mapFeature = map.queryRenderedFeatures(clickEvent.point, {
            filter: [
              'all',
              ['==', ['geometry-type'], 'LineString'],
              ['!=', ['get', 'source'], 'openmaptiles'], // Exclude base map features
              ['has', 'status'] // All sections in geojson LineStrings have a status
            ]
          });
          return mapFeature.length > 0;
        },
        getTooltipProps: () => {
          const mapFeature = map.queryRenderedFeatures(clickEvent.point, {
            filter: [
              'all',
              ['==', ['geometry-type'], 'LineString'],
              ['!=', ['get', 'source'], 'openmaptiles'], // Exclude base map features
              ['has', 'status'] // All sections in geojson LineStrings have a status
            ]
          })[0];

          const name = mapFeature.properties.name;

          const section = ensure(sections.find(f => f.properties.name === name));

          const lines = section.properties.lines;

          return { feature: section, lines: lines };
        },
        component: LineTooltip
      },
      {
        id: 'perspectives',
        isClicked: () => {
          if (!map.getLayer('perspectives')) { return false; }
          const mapFeature = map.queryRenderedFeatures(clickEvent.point, { layers: ['perspectives'] });
          return mapFeature.length > 0;
        },
        getTooltipProps: () => {
          const mapFeature = map.queryRenderedFeatures(clickEvent.point, { layers: ['perspectives'] })[0];
          const feature = features.find(f => {
            let ftyped = <PerspectiveFeature> f
            return ftyped.properties.type === 'perspective' &&
            ftyped.properties.line === mapFeature.properties.line &&
            ftyped.properties.imgUrl === mapFeature.properties.imgUrl;
          });

          return { feature };
        },
        component: PerspectiveTooltip
      },
      {
        id: 'compteurs',
        isClicked: () => {
          if (!map.getLayer('compteurs')) { return false; }
          const mapFeature = map.queryRenderedFeatures(clickEvent.point, { layers: ['compteurs'] });
          return mapFeature.length > 0;
        },
        getTooltipProps: () => {
          const mapFeature = map.queryRenderedFeatures(clickEvent.point, { layers: ['compteurs'] })[0];
          const feature = features.find(f => {
            let ftyped = <CompteurFeature> f
            ftyped.properties.name === mapFeature.properties.name
          });
          return { feature };
        },
        component: CounterTooltip
      },
      {
        id: 'dangers',
        isClicked: () => {
          if (!map.getLayer('dangers')) { return false; }
          const mapFeature = map.queryRenderedFeatures(clickEvent.point, { layers: ['dangers'] });
          return mapFeature.length > 0;
        },
        getTooltipProps: () => {
          const mapFeature = map.queryRenderedFeatures(clickEvent.point, { layers: ['dangers'] })[0];
          const feature = features.find(f => {
            let ftyped = <DangerFeature> f
            ftyped.properties.name === mapFeature.properties.name
          });
          return { feature };
        },
        component: DangerTooltip
      }
    ];

    const clickedLayer = layers.find(layer => layer.isClicked());
    if (!clickedLayer) { return; }

    new Popup({ closeButton: false, closeOnClick: true })
      .setLngLat(clickEvent.lngLat)
      .setHTML(`<div id="${clickedLayer.id}-tooltip-content"></div>`)
      .addTo(map);

    const props = clickedLayer.getTooltipProps();
    // @ts-ignore:next
    const component = defineComponent(clickedLayer.component);
    nextTick(() => {
      createApp({
        render: () => h(Suspense, null, {
          default: h(component, props),
          fallback: 'Chargement...'
        })
      }).mount(`#${clickedLayer.id}-tooltip-content`);
    });
  }

  async function loadImages({ map }: { map: Map }) {
    const camera = await map.loadImage('/icons/camera.png');
    map.addImage('camera-icon', camera.data, { sdf: true });

    const pump = await map.loadImage('/icons/pump.png');
    map.addImage('pump-icon', pump.data, { sdf: true });

    const danger = await map.loadImage('/icons/danger.png');
    map.addImage('danger-icon', danger.data, { sdf: false });

    const crossIconUrl = getCrossIconUrl();
    const cross = await map.loadImage(crossIconUrl);
    map.addImage('cross-icon', cross.data, { sdf: true });
  }

  return {
    loadImages,
    plotFeatures: plotEverything,
    getCompteursFeatures,
    fitBounds,
    toggleLimits,
    toggleBikeInfra,
    handleMapClick
  };
};
