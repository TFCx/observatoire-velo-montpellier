import { GeoJSONSource, LngLatBounds, Map, Popup } from 'maplibre-gl';
import { createApp, defineComponent, h, Suspense } from 'vue';
import type { CounterParsedContent } from '../types/counters';
import { isCompteurFeature, isDangerFeature, isPumpFeature, isLineStringFeature, isPerspectiveFeature, isPointFeature, type Feature, type PolygonFeature, type DisplayedLane, type LaneStatus, type LaneType, type LineStringFeature, isPolygonFeature, type CompteurFeature} from '~/types';
import { ref } from 'vue';

// Tooltips
import PerspectiveTooltip from '~/components/tooltips/PerspectiveTooltip.vue';
import CounterTooltip from '~/components/tooltips/CounterTooltip.vue';
import DangerTooltip from '~/components/tooltips/DangerTooltip.vue';
import LineTooltip from '~/components/tooltips/LineTooltip.vue';

type ColoredLineStringFeature = LineStringFeature & { properties: { color: string } };
const { getNbVoiesCyclables } = useConfig();
enum DisplayedLayer {
  Progress = 0,
  Quality = 1,
  Type = 2,
  FinalizedProject = 3,
}

const displayedLayer = ref(DisplayedLayer.Progress);

const laneWidth = 4

let layersWithLanes: string[] = []

const setDisplayedLayer = (value: DisplayedLayer) => {
  displayedLayer.value = value;
};

export { DisplayedLayer, setDisplayedLayer };

let postPonedOpacity = 0.5

let displayLimits = ref(false)

let displayBikeInfra = ref(false)

type MultiColoredLineStringFeature = LineStringFeature & { properties: { colors: string[] } };

type Compteur = {
  name: string;
  _path: string;
  description: string;
  idPdc: number;
  coordinates: [number, number];
  lines: number[];
  counts: Array<{
    month: string;
    count: number;
  }>;
};

// features plotted last are on top
const sortOrder = ["Anneau", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "A", "B", "C", "D"].reverse();

function sortByLine(featureA: LineStringFeature, featureB: LineStringFeature) {
  const lineA = featureA.properties.line;
  const lineB = featureB.properties.line;
  return sortOrder.indexOf(lineA) - sortOrder.indexOf(lineB);
}

function getCrossIconUrl(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 8; // Set the desired width of your icon
  canvas.height = 8; // Set the desired height of your icon
  const context = canvas.getContext('2d');
  if (!context) {
    return '';
  }

  // Draw the first diagonal line of the "X"
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(canvas.width, canvas.height);
  context.lineWidth = 3;
  context.stroke();

  // Draw the second diagonal line of the "X"
  context.beginPath();
  context.moveTo(0, canvas.height);
  context.lineTo(canvas.width, 0);
  context.lineWidth = 3;
  context.stroke();

  return canvas.toDataURL();
}

function groupFeaturesByColor(features: MultiColoredLineStringFeature[]) {
  const featuresByColor: Record<string, Feature[]> = {};
  for (const feature of features) {
    const color = feature.properties.colors[0];

    if (featuresByColor[color]) {
      featuresByColor[color].push(feature);
    } else {
      featuresByColor[color] = [feature];
    }
  }
  return featuresByColor;
}

export const useMap = () => {

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

  function plotSections(map: Map, features: MultiColoredLineStringFeature[]) {
    const lanes = separateSectionIntoLanes(features)
    const sections = features.map((feature, index) => ({ id: index, ...feature }));

    if (sections.length === 0 && !map.getLayer('highlight')) {
      return;
    }

    drawSectionBase(map, sections)

    drawLanesPlanned(map, lanes)

    drawLanesWIP(map, lanes)

    drawLanesDone(map, lanes);

    drawLanesPostponed(map, lanes)

    drawLanesVariante(map, lanes)

    drawLanesVariantePostponed(map, lanes)

    drawLanesUnknown(map, lanes)

    addListnersForHovering(map);
  }

  function plotPerspective({ map, features }: { map: Map; features: Feature[] }) {
    const perspectives = features.filter(isPerspectiveFeature).map(feature => ({
      ...feature,
      properties: {
        color: getLineColor(feature.properties.line),
        ...feature.properties
      }
    }));
    if (perspectives.length === 0) {
      return;
    }

    if (upsertMapSource(map, 'perspectives', perspectives)) {
      return;
    }

    map.addLayer({
      id: 'perspectives',
      source: 'perspectives',
      type: 'symbol',
      layout: {
        'icon-image': 'camera-icon',
        'icon-size': 0.5,
        'icon-offset': [-25, -25]
      },
      paint: {
        'icon-color': ["to-color", ['at', 0, ['get', 'colors']]]
      }
    });

    // on n'affiche les perspectives qu'à partir d'un certain zoom.
    // ceci pour éviter de surcharger la map.
    map.setLayoutProperty('perspectives', 'visibility', 'none');
    map.on('zoom', () => {
      const zoomLevel = map.getZoom();
      if (zoomLevel > 14) {
        map.setLayoutProperty('perspectives', 'visibility', 'visible');
      } else {
        map.setLayoutProperty('perspectives', 'visibility', 'none');
      }
    });

    // la souris devient un pointer au survol
    map.on('mouseenter', 'perspectives', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'perspectives', () => {
      map.getCanvas().style.cursor = '';
    });
  }

  function plotLimits({ map, features }: { map: Map, features: Feature[] }) {

    const limits = features.filter(isPolygonFeature);
    if(limits.length == 0) {
      return
    }

    const limitsWithId = limits.map((feature, index) => ({ id: index, ...feature }));

    if (limitsWithId.length === 0 && !map.getLayer('limits')) {
      return;
    }

    if (upsertMapSource(map, 'all-limits', limitsWithId)) {
      return;
    }

    drawLimits(map)
  }

  function plotDangers({ map, features }: { map: Map; features: Feature[] }) {
    const dangers = features.filter(isDangerFeature);
    if (dangers.length === 0) {
      return;
    }

    if (upsertMapSource(map, 'dangers', dangers)) {
      return;
    }

    map.addLayer({
      id: 'dangers',
      source: 'dangers',
      type: 'symbol',
      layout: {
        'icon-image': 'danger-icon',
        'icon-size': 0.5
      }
    });
    map.setLayoutProperty('perspectives', 'visibility', 'none');
    map.on('zoom', () => {
      const zoomLevel = map.getZoom();
      if (zoomLevel > 14) {
        map.setLayoutProperty('dangers', 'visibility', 'visible');
      } else {
        map.setLayoutProperty('dangers', 'visibility', 'none');
      }
    });
  }

  function plotPumps({ map, features }: { map: Map; features: Feature[] }) {
    const pumps = features.filter(isPumpFeature);
    if (pumps.length === 0) {
      return;
    }
    if (upsertMapSource(map, 'pumps', pumps)) {
      return;
    }
    map.addLayer({
      id: 'pumps',
      source: 'pumps',
      type: 'symbol',
      layout: {
        'icon-image': 'pump-icon',
        'icon-size': 0.5,
        'icon-offset': [-25, -25]
      },
      paint: {
        'icon-color': '#152B68'
      }
    });
  }

  function plotCompteurs({ map, features }: { map: Map; features: Feature[] }) {
    const compteurs = features.filter(isCompteurFeature);
    if (compteurs.length === 0) {
      return;
    }
    compteurs
      .sort((c1, c2) => (c2.properties.counts.at(-1)?.count ?? 0) - (c1.properties.counts.at(-1)?.count ?? 0))
      .map((c, i) => {
        // top counters are bigger and drawn above others
        const top = 10;
        c.properties.circleSortKey = i < top ? 1 : 0;
        c.properties.circleRadius = i < top ? 10 : 7;
        c.properties.circleStrokeWidth = i < top ? 3 : 0;
        return c;
      });

    map.addSource('compteurs', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: compteurs
      }
    });
    map.addLayer({
      id: 'compteurs',
      source: 'compteurs',
      type: 'circle',
      layout: {
        'circle-sort-key': ['get', 'circleSortKey']
      },
      paint: {
        'circle-color': '#152B68',
        'circle-stroke-color': '#fff',
        'circle-stroke-width': ['get', 'circleStrokeWidth'],
        'circle-radius': ['get', 'circleRadius']
      }
    });
    map.on('mouseenter', 'compteurs', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'compteurs', () => (map.getCanvas().style.cursor = ''));
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

  function fitBounds({ map, features }: { map: Map; features: Feature[] }) {
    const allLineStringsCoordinates = features
      .filter(isLineStringFeature)
      .map(feature => feature.geometry.coordinates)
      .flat();

    const allPointsCoordinates = features.filter(isPointFeature).map(feature => feature.geometry.coordinates);

    if (allPointsCoordinates.length === 0 && allLineStringsCoordinates.length === 0) {
      return;
    }

    if (features.length === 1 && allPointsCoordinates.length === 1) {
      map.flyTo({ center: allPointsCoordinates[0] });
    } else {
      const bounds = new LngLatBounds(allLineStringsCoordinates[0], allLineStringsCoordinates[0]);
      for (const coord of [...allLineStringsCoordinates, ...allPointsCoordinates]) {
        bounds.extend(coord);
      }
      map.fitBounds(bounds, { padding: 20 });
    }
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

  function plotFeatures({ map, updated_features }: { map: Map; updated_features?: Feature[] }) {
    plotBaseBikeInfrastructure(map)

    if(updated_features) {
      let lineStringFeatures = updated_features.filter(isLineStringFeature).sort(sortByLine).map(addLineColor);
      lineStringFeatures = addOtherLineColor(lineStringFeatures);

      plotSections(map, lineStringFeatures);
      setLanesColor(map, displayedLayer.value)

      watch(displayedLayer, (displayedLayer) => setLanesColor(map, displayedLayer))

      plotPerspective({ map, features: updated_features });
      plotCompteurs({ map, features: updated_features });
      plotPumps({ map, features: updated_features });
      plotDangers({ map, features: updated_features });
      plotLimits({ map, features: updated_features });

      watch(displayLimits, (displayLimits) => toggleLimitsVisibility(map, displayLimits))
      watch(displayBikeInfra, (displayBikeInfra) => toggleBikeInfraVisibility(map, displayBikeInfra))
    }
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

  return {
    loadImages,
    plotFeatures,
    getCompteursFeatures,
    fitBounds,
    toggleLimits,
    toggleBikeInfra,
    handleMapClick
  };
};

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

function setLanesColor(map: Map, displayedLayer: DisplayedLayer) {
  layersWithLanes.forEach(l => {

    if (displayedLayer == DisplayedLayer.Quality) {
      map.setPaintProperty(l, "line-color", ["case",
        ["==", ['get', 'quality'], "bad"], "#ff6961",
        ["==", ['get', 'quality'], "fair"], "#F3F32A",
        ["==", ['get', 'quality'], "good"], "#77dd77",
        ["==", ['get', 'status'], "done"], "#000000",
        "white"
      ]);
    } else if (displayedLayer == DisplayedLayer.Progress) {
      map.setPaintProperty(l, "line-color", ["case",
        ["==", ['get', 'status'], "done"], "#92c5de",
        ["==", ['get', 'status'], "wip"], "#fddbc7",
        ["==", ['get', 'status'], "planned"], "#f4a582",
        ["==", ['get', 'status'], "postponed"], "#d6604d",
        "white"
      ]);
    } else if (displayedLayer == DisplayedLayer.FinalizedProject) {
      map.setPaintProperty(l, "line-color", ["to-color", ['get', 'color']]);
    } else if (displayedLayer == DisplayedLayer.Type) {
      map.setPaintProperty(l, "line-color", ["case",
        ["==", ['get', 'type'], "bidirectionnelle"], "#b3c6ff", // bleu
        ["==", ['get', 'type'], "bilaterale"], "#b3fbff", // cyan
        ["==", ['get', 'type'], "bandes-cyclables"], "#c1b3ff", // bleu-violet
        ["==", ['get', 'type'], "voie-bus"], "#fbb3ff", // violet
        ["==", ['get', 'type'], "voie-bus-elargie"], "#e1b3ff", // violet
        ["==", ['get', 'type'], "velorue"], "#fffbb3", // jaune
        ["==", ['get', 'type'], "voie-verte"], "#b3ffb6", // vert
        ["==", ['get', 'type'], "zone-de-rencontre"], "#daffb3", // vert clair
        ["==", ['get', 'type'], "chaucidou"], "#ffeab3", // orange
        ["==", ['get', 'type'], "heterogene"], "#797979", // gris foncé
        ["==", ['get', 'type'], "aucun"], "#ff9999", // rouge
        ["==", ['get', 'status'], "done"], "#000000", // black
        ["==", ['get', 'type'], "inconnu"], "#dedede", // gris
        "white"
      ]);
    }
  });
}

function upsertMapSource(map: Map, sourceName: string, features: Feature[]) {
  const source = map.getSource(sourceName) as GeoJSONSource;
  if (source) {
    source.setData({ type: 'FeatureCollection', features });
    return true;
  }
  map.addSource(sourceName, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features }
  });
  return false;
}

function drawLanesDone(map: Map, lanes: DisplayedLane[]) {

  let lanes_done = lanes.filter(lane => lane.properties.status === "done");
  if (upsertMapSource(map, 'source-all-lanes-done', lanes_done)) {
    return;
  }

  map.addLayer({
    id: `layer-lanes-done`,
    type: 'line',
    source: 'source-all-lanes-done',
    paint: {
      'line-width': laneWidth,
      'line-color': ["to-color", ['get', 'color']],
      'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
    }
  });
  layersWithLanes.push("layer-lanes-done")
}

function drawLanesPlanned(map: Map, lanes: DisplayedLane[]) {

  let lanes_planned = lanes.filter(lane => lane.properties.status === "planned");
  if (upsertMapSource(map, 'source-all-lanes-planned', lanes_planned)) {
    return;
  }

  map.addLayer({
    id: `layer-lanes-planned`,
    type: 'line',
    source: 'source-all-lanes-planned',
    paint: {
      'line-width': laneWidth,
      'line-color': ["to-color", ['get', 'color']],
      'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
    }
  });
  layersWithLanes.push("layer-lanes-planned")
}

function drawLanesVariante(map: Map, lanes: DisplayedLane[]) {

  let lanes_variante = lanes.filter(lane => lane.properties.status === "variante");
  if (upsertMapSource(map, 'source-all-lanes-variante', lanes_variante)) {
    return;
  }

  map.addLayer({
    id: 'layer-lanes-variante',
    type: 'line',
    source: 'source-all-lanes-variante',
    paint: {
      'line-width': laneWidth,
      'line-color': ["to-color", ['get', 'color']],
      'line-dasharray': [2, 2],
      'line-opacity': 0.5,
      'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
    }
  });
  layersWithLanes.push("layer-lanes-variante")
}

function drawLanesVariantePostponed(map: Map, lanes: DisplayedLane[]) {

  let lanes_variante_postponed = lanes.filter(lane => lane.properties.status === "variante-postponed");
  if (upsertMapSource(map, 'source-all-lanes-variante-postponed', lanes_variante_postponed)) {
    return;
  }

  map.addLayer({
    id: 'layer-lanes-variante-postponed',
    type: 'line',
    source: 'source-all-lanes-variante-postponed',
    paint: {
      'line-width': laneWidth,
      'line-color': ["to-color", ['get', 'color']],
      'line-dasharray': [2, 2],
      'line-opacity': 0.5,
      'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
    }
  });
  layersWithLanes.push("layer-lanes-variante-postponed")
}

function drawLanesUnknown(map: Map, lanes: DisplayedLane[]) {

  let lanes_unknown = lanes.filter(lane => lane.properties.status === "unknown");
  if (upsertMapSource(map, 'source-all-lanes-unknown', lanes_unknown)) {
    return;
  }

  map.addLayer({
    id: 'layer-lanes-unknown',
    type: 'line',
    source: 'source-all-lanes-unknown',
    layout: {
      'line-cap': 'round'
    },
    paint: {
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        11,
        4, // width 4 at low zoom
        14,
        25 // progressively reach width 25 at high zoom
      ],
      'line-color': ["to-color", ['at', 0, ['get', 'colors']]],
      'line-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        11,
        0.5, // opacity 0.4 at low zoom
        14,
        0.35 // opacity 0.35 at high zoom
      ]
    }
  });
  layersWithLanes.push("layer-lanes-unknown")
}

function drawLanesPostponed(map: Map, lanes: DisplayedLane[]) {

  let lanes_postponed = lanes.filter(lane => lane.properties.status === "postponed");
  if (upsertMapSource(map, 'source-all-lanes-postponed', lanes_postponed)) {
    return;
  }

  map.addLayer({
    id: `layer-lanes-postponed`,
    type: 'line',
    source: 'source-all-lanes-postponed',
    paint: {
      'line-width': laneWidth,
      'line-color': ["to-color", ['get', 'color']],
      'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
    }
  });
  layersWithLanes.push("layer-lanes-postponed")
}


function drawLanesWIP(map: Map, lanes: DisplayedLane[]) {

  let lanes_wip = lanes.filter(lane => lane.properties.status === "wip" || lane.properties.status === "tested");
  if (upsertMapSource(map, 'source-all-lanes-wip', lanes_wip)) {
    return;
  }

  map.addLayer({
    id: `layer-lanes-wip`,
    type: 'line',
    source: 'source-all-lanes-wip',
    paint: {
      'line-width': laneWidth,
      'line-color': ["to-color", ['get', 'color']],
      'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
    }
  });
  layersWithLanes.push("layer-lanes-wip")
}

function addListnersForHovering(map: Map) {

  // Add MouveMove event listner => maybe a section is hovered
  let hoveredLineId: any = null;
  map.on('mousemove', 'highlight', (e: any) => {
    map.getCanvas().style.cursor = 'pointer';
    if (e.features.length > 0) {
      if (hoveredLineId !== null) {
        map.setFeatureState({ source: 'all-sections', id: hoveredLineId }, { hover: false });
      }
      if (e.features[0].id !== undefined) {
        hoveredLineId = e.features[0].id;
        if (hoveredLineId !== null) {
          map.setFeatureState({ source: 'all-sections', id: hoveredLineId }, { hover: true });
        }
      }
    }
  });

  // Add MouveLeave event listner => all sections are no hovered
  map.on('mouseleave', 'highlight', () => {
    map.getCanvas().style.cursor = '';
    if (hoveredLineId !== null) {
      map.setFeatureState({ source: 'all-sections', id: hoveredLineId }, { hover: false });
    }
    hoveredLineId = null;
  });
}

function drawLimits(map: Map) {
  map.addLayer({
    id: 'limits',
    type: 'line',
    source: 'all-limits',
    layout: {
      visibility: "none"
    },
    paint: {
      'line-width': 1.5,
      'line-dasharray': [2.2, 2.2],
      'line-color': '#ff0000',
      'line-opacity': 0.35
    }
  });
}

function drawSectionBase(map: Map, sections: Feature[]) {

  if (upsertMapSource(map, 'all-sections', sections)) {
    return;
  }

  drawHoveredEffect(map);

  drawSectionContour(map);

  drawSectionBackground(map);
}

function drawSectionBackground(map: Map) {
  map.addLayer({
    id: 'underline',
    type: 'line',
    source: 'all-sections',
    paint: {
      'line-width': ["*", laneWidth, ['length', ['get', 'colors']]],
      'line-color': '#ffffff',
    }
  });
}

function drawHoveredEffect(map: Map) {
  map.addLayer({
    id: 'highlight',
    type: 'line',
    source: 'all-sections',
    layout: { 'line-cap': 'round' },
    paint: {
      'line-gap-width': 5,
      'line-width': ["*", laneWidth, ['length', ['get', 'colors']]],
      'line-color': ['case', ['boolean', ['feature-state', 'hover'], false], '#9ca3af', '#FFFFFF'],
      "line-opacity": 0.5
    }
  });
}

function drawSectionContour(map: Map) {
  map.addLayer({
    id: 'contour',
    type: 'line',
    source: 'all-sections',
    layout: { 'line-cap': 'round' },
    paint: {
      'line-gap-width': ["*", laneWidth, ['length', ['get', 'colors']]],
      'line-width': 1,
      'line-color': '#6b7280',
    }
  });
}

// plot base bike infrastructure from OSM API
async function plotBaseBikeInfrastructure(map: Map) {

  // Overpass request
  const basehttp = 'https://overpass-api.de/api/interpreter?data=[out:json];'
  const request = 'area["name"="Montpellier"]->.searchArea;(way["highway"~"cycleway|cycleway_lane|cycleway_track"](area.searchArea);way["bicycle"~"designated"](area.searchArea);way["cycleway:left"="track"](area.searchArea);way["cycleway:right"="track"](area.searchArea);way["cycleway:left"="opposite_track"](area.searchArea);way["cycleway:right"="opposite_track"](area.searchArea);way["cycleway:left"="lane"](area.searchArea);way["cycleway:right"="lane"](area.searchArea););out ids geom;>;out skel qt;'

  const apiUrl = basehttp + encodeURI(request)
  const data = await fetchBikeLanesGeojsonData(apiUrl);

  map.addSource('source-base-infrastructure', {
    type: 'geojson',
    data: data
  });

  const lw = 2.2

  map.addLayer({
      id: 'layer-underline-base-infrastructure',
      type: 'line',
      source: 'source-base-infrastructure',
      layout: {
        visibility: "none"
      },
      paint: {
        'line-width': lw,
        'line-color': '#000055',
        'line-opacity': 0.8
      }
    },
    'highlight' // push layer to the background
  );
}

async function fetchBikeLanesGeojsonData(apiUrl: string): Promise<any> {
  const response = await fetch(apiUrl);
  const data = await response.json();

  const geojson = {
    type: 'FeatureCollection',
    features: data.elements.map((element: any) => {
      if (!element.geometry) return [];
      const feature = {
        type: 'Feature',
        properties: {
          id: element.id,
          tags: element.tags
        },
        geometry: {
          type: 'LineString',
          coordinates: element.geometry.map((geometry: any) => {
            return [geometry.lon, geometry.lat];
          })
        }
      };
      return feature;
    })
  };

  geojson.features = geojson.features.filter((feature: any) => feature.type);

  return geojson;
}