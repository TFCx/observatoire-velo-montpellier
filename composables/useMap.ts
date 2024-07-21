import { GeoJSONSource, LngLatBounds, Map } from 'maplibre-gl';
import { isCompteurFeature, isLineStringFeature, isPerspectiveFeature, isPointFeature, type Feature, type DisplayedLane, type LaneStatus, type LaneType, type LineStringFeature, type Quality } from '~/types';
import { ref } from 'vue';

const shouldDisplayQuality = ref(false);

const laneWidth = 4

const toggleShouldDisplayQuality = () => {
  shouldDisplayQuality.value = !shouldDisplayQuality.value;
};

const setShouldDisplayQuality = (value: boolean) => {
  shouldDisplayQuality.value = value;
};

export { shouldDisplayQuality, toggleShouldDisplayQuality, setShouldDisplayQuality };

let postPonedOpacity = 0.5

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


  function plotQualityBackgroundNok({ map, features }: { map: Map; features: LineStringFeature[] }) {
    const sections = features.filter(feature => feature.properties.quality === 'non satisfaisant');

    if (sections.length === 0 && !map.getLayer('quality-non-satisfaisant')) {
      return;
    }
    if (upsertMapSource(map, 'quality-non-satisfaisant', sections)) {
      return;
    }

    map.addLayer({
      id: 'quality-non-satisfaisant',
      type: 'line',
      source: 'quality-non-satisfaisant',
      layout: { 'line-cap': 'round' },
      paint: {
        'line-gap-width': 5,
        'line-width': 8,
        'line-color': '#ffa3af',
        "line-opacity" : ["case",
          ["==", shouldDisplayQuality.value, true], 1.0,
          0.0
        ]
      }
    });

    // Watcher pour mettre à jour la propriété line-opacity du calque
    watch(shouldDisplayQuality, (shouldDisplayQuality) => {
      map.setPaintProperty('quality-non-satisfaisant', 'line-opacity', shouldDisplayQuality ? 1.0 : 0.0);
    });
  }

  function plotQualityBackgroundOk({ map, features }: { map: Map; features: LineStringFeature[] }) {
    const sections = features.filter(feature => feature.properties.quality === 'satisfaisant');

    if (sections.length === 0 && !map.getLayer('quality-satisfaisant')) {
      return;
    }
    if (upsertMapSource(map, 'quality-satisfaisant', sections)) {
      return;
    }


    map.addLayer({
      id: 'quality-satisfaisant',
      type: 'line',
      source: 'quality-satisfaisant',
      layout: { 'line-cap': 'round' },
      paint: {
        'line-gap-width': 5,
        'line-width': 8,
        'line-color': '#9cffaf',
        "line-opacity" : ["case",
          ["==", shouldDisplayQuality.value, true], 1.0,
          0.0
        ]
      }
    });

    // Watcher pour mettre à jour la propriété line-opacity du calque
    watch(shouldDisplayQuality, (shouldDisplayQuality) => {
      map.setPaintProperty('quality-satisfaisant', 'line-opacity', shouldDisplayQuality ? 1.0 : 0.0);
    });
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
    if (upsertMapSource(map, 'all-sections', sections)) {
      return;
    }

    drawHoveredEffect(map);

    drawSectionContour(map);

    drawSectionBackground(map);

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

  function animateColor(map: Map, timestamp: number, animationLength: number, attribute: string) {

    function subAnimateColor(timestamp: number) {
      const t = (timestamp % animationLength) / animationLength
      // WIP : trouver les index out of bounds
      map.setPaintProperty(attribute, 'line-color', ["to-color", ['at', ['floor', ['*', t, ['length', ['get', 'colors']]]], ['get', 'colors']]]);

      // Request the next frame of the animation.
      requestAnimationFrame(subAnimateColor);
    }
    subAnimateColor(timestamp)
  }



  function plotFeatures({ map, features }: { map: Map; features: Feature[] }) {
    let lineStringFeatures = features.filter(isLineStringFeature).sort(sortByLine).map(addLineColor);
    lineStringFeatures = addOtherLineColor(lineStringFeatures)

    plotQualityBackgroundNok({ map, features: lineStringFeatures });
    plotQualityBackgroundOk({ map, features: lineStringFeatures });

    plotSections(map, lineStringFeatures);

    plotPerspective({ map, features });
    plotCompteurs({ map, features });
  }

  return {
    loadImages,
    plotFeatures,
    getCompteursFeatures,
    fitBounds
  };
};

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
  if (upsertMapSource(map, 'all-lanes-done', lanes_done)) {
    return;
  }

  map.addLayer({
    id: `done-lanes`,
    type: 'line',
    source: 'all-lanes-done',
    paint: {
      'line-width': laneWidth,
      'line-color': ["to-color", ['get', 'color']],
      'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
    }
  });
}

function drawLanesPlanned(map: Map, lanes: DisplayedLane[]) {

  let lanes_planned = lanes.filter(lane => lane.properties.status === "planned");
  if (upsertMapSource(map, 'all-lanes-planned', lanes_planned)) {
    return;
  }

  map.addLayer({
    id: `planned-lanes`,
    type: 'line',
    source: 'all-lanes-planned',
    paint: {
      'line-width': laneWidth,
      'line-color': ["to-color", ['get', 'color']],
      'line-dasharray': [0.4, 1.1],
      'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
    }
  });
}

function drawLanesVariante(map: Map, lanes: DisplayedLane[]) {

  let lanes_variante = lanes.filter(lane => lane.properties.status === "variante");
  if (upsertMapSource(map, 'all-lanes-variante', lanes_variante)) {
    return;
  }

  map.addLayer({
    id: 'variante-sections',
    type: 'line',
    source: 'all-lanes-variante',
    paint: {
      'line-width': laneWidth,
      'line-color': ["to-color", ['get', 'color']],
      'line-dasharray': [2, 2],
      'line-opacity': 0.5,
      'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
    }
  });
  map.addLayer({
    id: 'variante-symbols',
    type: 'symbol',
    source: 'all-lanes-variante',
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

  map.on('mouseenter', 'variante-sections', () => (map.getCanvas().style.cursor = 'pointer'));
  map.on('mouseleave', 'variante-sections', () => (map.getCanvas().style.cursor = ''));
}

function drawLanesVariantePostponed(map: Map, lanes: DisplayedLane[]) {

  let lanes_variante_postponed = lanes.filter(lane => lane.properties.status === "variante-postponed");
  if (upsertMapSource(map, 'all-lanes-variante-postponed', lanes_variante_postponed)) {
    return;
  }

  map.addLayer({
    id: 'variante-postponed-sections',
    type: 'line',
    source: 'all-lanes-variante-postponed',
    paint: {
      'line-width': laneWidth,
      'line-color': ["to-color", ['get', 'color']],
      'line-dasharray': [2, 2],
      'line-opacity': 0.5,
      'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
    }
  });

  map.addLayer({
    id: 'variante-postponed-symbols',
    type: 'symbol',
    source: 'all-lanes-variante-postponed',
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

  map.on('mouseenter', 'variante-postponed-sections', () => (map.getCanvas().style.cursor = 'pointer'));
  map.on('mouseleave', 'variante-postponed-sections', () => (map.getCanvas().style.cursor = ''));
}

function drawLanesUnknown(map: Map, lanes: DisplayedLane[]) {

  let lanes_unknown = lanes.filter(lane => lane.properties.status === "unknown");
  if (upsertMapSource(map, 'all-lanes-unknown', lanes_unknown)) {
    return;
  }

  map.addLayer({
    id: 'unknown-sections',
    type: 'line',
    source: 'all-lanes-unknown',
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
    id: 'unknown-symbols',
    type: 'symbol',
    source: 'all-lanes-unknown',
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

  map.on('mouseenter', 'unknown-sections', () => (map.getCanvas().style.cursor = 'pointer'));
  map.on('mouseleave', 'unknown-sections', () => (map.getCanvas().style.cursor = ''));
}

function drawLanesPostponed(map: Map, lanes: DisplayedLane[]) {

  let lanes_postponed = lanes.filter(lane => lane.properties.status === "postponed");
  if (upsertMapSource(map, 'all-lanes-postponed', lanes_postponed)) {
    return;
  }

  map.addLayer({
    id: `postponed-lanes`,
    type: 'line',
    source: 'all-lanes-postponed',
    paint: {
      'line-width': laneWidth,
      'line-color': ["to-color", ['get', 'color']],
      'line-dasharray': [0.4, 1.1],
      'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
    }
  });

  map.addLayer({
    id: `postponed-text`,
    type: 'symbol',
    source: `all-lanes-postponed`,
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

    animateOpacity(map, 0, 1000*5.0, 'postponed-lanes', 'line-opacity', 0.0, postPonedOpacity );
    animateOpacity(map, 0, 1000*5.0, 'postponed-text', 'text-opacity',postPonedOpacity, postPonedOpacity + 0.4);

    map.on('mouseenter', `postponed-symbols`, () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', `postponed-symbols`, () => (map.getCanvas().style.cursor = ''));
}


function drawLanesWIP(map: Map, lanes: DisplayedLane[]) {

  let lanes_wip = lanes.filter(lane => lane.properties.status === "wip");
  if (upsertMapSource(map, 'all-lanes-wip', lanes_wip)) {
    return;
  }

  map.addLayer({
    id: `wip-lanes`,
    type: 'line',
    source: 'all-lanes-wip',
    paint: {
      'line-width': laneWidth,
      'line-color': ["to-color", ['get', 'color']],
      'line-dasharray': [0.2, 1.1],
      'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
    }
  });

  map.addLayer({
    id: 'wip-sections-done',
    type: 'line',
    source: 'all-lanes-wip',
    paint: {
      'line-width': laneWidth,
      'line-color': ["to-color", ['get', 'color']],
      'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
    }
  });

  animateOpacity(map, 0, 1000*0.75, 'wip-sections-done', 'line-opacity', 0.5, 0.9);
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

