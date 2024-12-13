import { Map, Popup } from 'maplibre-gl';
import { createApp, defineComponent, h, Suspense } from 'vue';
import type { CounterParsedContent } from '../types/counters';
import { isLineStringFeature, type Feature, type DisplayedLane, type LineStringFeature, type CompteurFeature} from '~/types';
import { ref } from 'vue';

import { drawLanesBase, drawLanesDone, drawLanesPlanned, drawLanesWIP, drawLanesPostponed, drawLanesAsDone, addListnersForHovering, setLanesColor } from "./map/network";
import { plotPerspective, plotCompteurs, plotDangers, plotLimits, plotPumps, plotBaseBikeInfrastructure } from "./map/features";

// Tooltips
import PerspectiveTooltip from '~/components/tooltips/PerspectiveTooltip.vue';
import CounterTooltip from '~/components/tooltips/CounterTooltip.vue';
import DangerTooltip from '~/components/tooltips/DangerTooltip.vue';
import LineTooltip from '~/components/tooltips/LineTooltip.vue';
import { getCrossIconUrl, sortByLine, fitBounds } from './map/utils';

enum DisplayedLayer {
  Progress = 0,
  Quality = 1,
  Type = 2,
  FinalizedProject = 3,
}

const displayedLayer = ref(DisplayedLayer.Progress);



const setDisplayedLayer = (value: DisplayedLayer) => {
  displayedLayer.value = value;
};

export { DisplayedLayer, setDisplayedLayer };


let displayLimits = ref(false)

let displayBikeInfra = ref(false)


type MultiColoredLineStringFeature = LineStringFeature & { properties: { colors: string[] } };


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


// function groupFeaturesByColor(features: MultiColoredLineStringFeature[]) {
//   const featuresByColor: Record<string, Feature[]> = {};
//   for (const feature of features) {
//     const color = feature.properties.colors[0];

//     if (featuresByColor[color]) {
//       featuresByColor[color].push(feature);
//     } else {
//       featuresByColor[color] = [feature];
//     }
//   }
//   return featuresByColor;
// }

export const useMap = () => {

  function plotEverything({ map, updated_features }: { map: Map; updated_features?: Feature[] }) {
    plotBaseBikeInfrastructure(map)

    if(updated_features) {
      let lineStringFeatures = updated_features.filter(isLineStringFeature).sort(sortByLine).map(addLineColor);
      lineStringFeatures = addOtherLineColor(lineStringFeatures);

      plotNetwork(map, lineStringFeatures);
      setLanesColor(map, displayedLayer.value)
      watch(displayedLayer, (displayedLayer) => setLanesColor(map, displayedLayer))

      plotFeatures({map, updated_features})
    }
  }

  function plotNetwork(map: Map, features: MultiColoredLineStringFeature[]) {
    const lanes = separateSectionIntoLanes(features)
    const lanesWithId = lanes.map((feature, index) => ({ id: index, ...feature }));

    if (lanesWithId.length === 0 && !map.getLayer('highlight')) {
      return;
    }

    drawLanesBase(map, features, lanesWithId)

    drawLanesPlanned(map, lanes)

    drawLanesWIP(map, lanes)

    drawLanesDone(map, lanes);

    drawLanesPostponed(map, lanes)

    // drawLanesVariante(map, lanes)

    // drawLanesVariantePostponed(map, lanes)

    // drawLanesUnknown(map, lanes)

    drawLanesAsDone(map, lanes);

    addListnersForHovering(map);
  }

  function plotFeatures({ map, updated_features }: { map: Map; updated_features: Feature[] }) {

    plotPerspective({ map, features: updated_features });
    plotCompteurs({ map, features: updated_features });
    plotPumps({ map, features: updated_features });
    plotDangers({ map, features: updated_features });
    plotLimits({ map, features: updated_features });

    watch(displayLimits, (displayLimits) => toggleLimitsVisibility(map, displayLimits))
    watch(displayBikeInfra, (displayBikeInfra) => toggleBikeInfraVisibility(map, displayBikeInfra))
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

  function separateSectionIntoLanes(features: MultiColoredLineStringFeature[]): DisplayedLane[] {
    let lanes: DisplayedLane[] = []
    features.forEach(f => {
      f.properties.colors.forEach((c, index) => {
        let lane: DisplayedLane = {
          type: f.type,
          properties: {
            id: f.properties.id,
            line: f.properties.line,
            name: f.properties.name,
            lane_index: index,
            nb_lanes: f.properties.colors.length,
            color: c,
            status: f.properties.status,
            quality: f.properties.quality,
            type: f.properties.type,
            doneAt: f.properties.doneAt,
            link: f.properties.link
          },
          geometry: f.geometry
        }

        lanes.push(lane)
      })
    })
    return lanes
  }

  const { getLineColor } = useColors();

  function addLineColor(feature: LineStringFeature): MultiColoredLineStringFeature {
    return {
      ...feature,
      properties: {
        colors: [getLineColor(feature.properties.line)],
        ...feature.properties
      }
    };
  }

  function addOtherLineColor(features: MultiColoredLineStringFeature[]) {
    for(let f of features) {
      if(f.properties.id) {
        for(let o of features) {
          if(o != f && f.properties.id == o.properties.id) {
            f.properties.colors.push(o.properties.colors[0])
          }
        }
      }
    }
    return features
  }

  function handleMapClick({ map, features, clickEvent }: { map: Map; features: Feature[]; clickEvent: any }) {
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

          const line = mapFeature.properties.line;
          const name = mapFeature.properties.name;

          const lineStringFeatures = features.filter(isLineStringFeature);

          const feature = lineStringFeatures
            .find(f => f.properties.line === line && f.properties.name === name);

          const lines = feature!.properties.id
            ? [...new Set(lineStringFeatures.filter(f => f.properties.id === feature!.properties.id).map(f => f.properties.line))]
            : [feature!.properties.line];

          return { feature, lines };
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
            return f.properties.type === 'perspective' &&
            f.properties.line === mapFeature.properties.line &&
            f.properties.imgUrl === mapFeature.properties.imgUrl;
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
          const feature = features.find(f => f.properties.name === mapFeature.properties.name);
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
          const feature = features.find(f => f.properties.name === mapFeature.properties.name);
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
