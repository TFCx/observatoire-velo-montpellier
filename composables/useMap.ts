import { GeoJSONSource, LngLatBounds, Map } from 'maplibre-gl';
import { isCompteurFeature, isLineStringFeature, isPerspectiveFeature, isPointFeature, type Feature, type PolygonFeature, type DisplayedLane, type LaneStatus, type LaneType, type LineStringFeature, isPolygonFeature} from '~/types';
import { ref } from 'vue';

enum DisplayedLayer {
  Network = 0,
  Quality = 1,
  Type = 2,
}

const displayedLayer = ref(DisplayedLayer.Network);

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
    map.setLayoutProperty('perspectives', 'visibility', 'none');
    map.on('zoom', () => {
      const zoomLevel = map.getZoom();
      if (zoomLevel > 14) {
        map.setLayoutProperty('perspectives', 'visibility', 'visible');
      } else {
        map.setLayoutProperty('perspectives', 'visibility', 'none');
      }
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
    counters: Compteur[];
    type: 'compteur-velo' | 'compteur-voiture';
  }) {
    if (counters.length === 0) {
      return;
    }

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
        coordinates: counter.coordinates
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

  function plotFeatures({ map, updated_features, initialLayer }: { map: Map; updated_features?: Feature[], initialLayer: DisplayedLayer }) {
    plotBaseBikeInfrastructure(map)

    if(updated_features) {
      let lineStringFeatures = updated_features.filter(isLineStringFeature).sort(sortByLine).map(addLineColor);
      lineStringFeatures = addOtherLineColor(lineStringFeatures);

      plotSections(map, lineStringFeatures);

      setDisplayedLayer(initialLayer)
      setLanesColor(map, initialLayer)

      watch(displayedLayer, (displayedLayer) => setLanesColor(map, displayedLayer))

      plotPerspective({ map, features: updated_features });
      plotCompteurs({ map, features: updated_features });
      plotLimits({ map, features: updated_features });

      watch(displayLimits, (displayLimits) => toggleLimitsVisibility(map, displayLimits))
      watch(displayBikeInfra, (displayBikeInfra) => toggleBikeInfraVisibility(map, displayBikeInfra))
    }
  }

  return {
    loadImages,
    plotFeatures,
    getCompteursFeatures,
    fitBounds,
    toggleLimits,
    toggleBikeInfra,
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
    } else if (displayedLayer == DisplayedLayer.Network) {
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

function animateOpacity(map: Map, timestamp: number, animationLength: number, attributeId: string, attributeOpacity: string, min: number, max: number) {

  function subAnimateOpacity(timestamp: number) {
    const opacity010 = Math.abs((((timestamp * 2) * (1 / animationLength)) % 2) - 1)
    const opacity = opacity010 * (max - min) + min
    map.setPaintProperty(attributeId, attributeOpacity, opacity);

    // Request the next frame of the animation.
    requestAnimationFrame(subAnimateOpacity);
  }
  subAnimateOpacity(timestamp)
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
      'line-dasharray': [0.6, 1.2],
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
  map.addLayer({
    id: 'layer-lanes-variante-symbols',
    type: 'symbol',
    source: 'source-all-lanes-variante',
    paint: {
      'text-halo-color': '#fff',
      'text-halo-width': 4
    },
    layout: {
      'symbol-placement': 'line',
      'symbol-spacing': 120,
      'text-font': ['Open Sans Regular'],
      'text-field': ['coalesce', ['get', 'text'], 'variante'],
      'text-size': 14
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

  map.addLayer({
    id: 'layer-lanes-variante-postponed-symbols',
    type: 'symbol',
    source: 'source-all-lanes-variante-postponed',
    paint: {
      'text-halo-color': '#fff',
      'text-halo-width': 4
    },
    layout: {
      'symbol-placement': 'line',
      'symbol-spacing': 120,
      'text-font': ['Open Sans Regular'],
      'text-field': ['coalesce', ['get', 'text'], 'variante reportée'],
      'text-size': 14
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
  map.addLayer({
    id: 'layer-lanes-unknown-symbols',
    type: 'symbol',
    source: 'source-all-lanes-unknown',
    paint: {
      'text-halo-color': '#fff',
      'text-halo-width': 3
    },
    layout: {
      'symbol-placement': 'line',
      'symbol-spacing': 120,
      'text-font': ['Open Sans Regular'],
      'text-field': 'tracé à définir',
      'text-size': 14
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
      'line-dasharray': [0.4, 1.1],
      'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
    }
  });

  map.addLayer({
    id: `layer-lanes-postponed-symbols`,
    type: 'symbol',
    source: `source-all-lanes-postponed`,
    paint: {
      'text-halo-color': '#fff',
      'text-halo-width': 3,
      "text-opacity": postPonedOpacity + 0.4
    },
    layout: {
      'symbol-placement': 'line',
      'symbol-spacing': 100,
      'text-font': ['Open Sans Regular'],
      'text-field': 'reporté',
      'text-size': 14,
    }
  });
  layersWithLanes.push("layer-lanes-postponed")

  animateOpacity(map, 0, 1000*5.0, 'layer-lanes-postponed', 'line-opacity', 0.0, postPonedOpacity );
  animateOpacity(map, 0, 1000*5.0, 'layer-lanes-postponed-symbols', 'text-opacity',postPonedOpacity, postPonedOpacity + 0.4);
}


function drawLanesWIP(map: Map, lanes: DisplayedLane[]) {

  let lanes_wip = lanes.filter(lane => lane.properties.status === "wip");
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
      'line-dasharray': [0.2, 1.1],
      'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
    }
  });

  map.addLayer({
    id: 'layer-lanes-wip-done',
    type: 'line',
    source: 'source-all-lanes-wip',
    paint: {
      'line-width': laneWidth,
      'line-color': ["to-color", ['get', 'color']],
      'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
    }
  });
  layersWithLanes.push("layer-lanes-wip")
  layersWithLanes.push("layer-lanes-wip-done")

  animateOpacity(map, 0, 1000*0.75, 'layer-lanes-wip-done', 'line-opacity', 0.5, 0.9);
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